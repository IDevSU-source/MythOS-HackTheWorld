from pathlib import Path
from PIL import Image

UPSTREAM = Path('/home/ubuntu/upstream-tps/assets/infographics')
DESTINATION = Path('/home/ubuntu/tps-app/assets/infographics')
INDEX = Path('/home/ubuntu/tps-app/lib/infographics.ts')
MAX_EDGE = 1280

DESTINATION.mkdir(parents=True, exist_ok=True)

files = sorted(path for path in UPSTREAM.iterdir() if path.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'})
for source in files:
    target = DESTINATION / source.name
    with Image.open(source) as image:
        rendered = image.convert('RGB')
        rendered.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
        rendered.save(target, format='JPEG', quality=82, optimize=True, progressive=True)

lines = [
    'import type { ImageSourcePropType } from "react-native";',
    '',
    '// Generated from the upstream HackTheWorldTPS infographic directory.',
    'export const INFOGRAPHICS: Record<string, ImageSourcePropType> = {',
]
for source in files:
    lines.append(f'  "{source.name}": require("../assets/infographics/{source.name}"),')
lines.extend([
    '};',
    '',
    'export function getInfographicAsset(assetName: string): ImageSourcePropType | undefined {',
    '  return INFOGRAPHICS[assetName];',
    '}',
    '',
    'export const INFOGRAPHIC_COUNT = Object.keys(INFOGRAPHICS).length;',
])
INDEX.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(f'Imported {len(files)} infographics to {DESTINATION}')
