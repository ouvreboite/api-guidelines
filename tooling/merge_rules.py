import os
import re

def extract_spectral_codeblocks(file_path):
    with open(file_path, 'r') as file:
        content = file.read()
    spectral_blocks = re.findall(r'```yaml\n#spectral(.*?)```', content, re.DOTALL)
    return spectral_blocks

markdown_files = [f for f in os.listdir('rules') if f.endswith('.md')]

spectral_blocks = []
for file in markdown_files:
    blocks = extract_spectral_codeblocks(os.path.join('rules', file))
    print(file, ": ", len(blocks) , "spectral blocks found.")
    spectral_blocks.extend(blocks)

with open('tooling/spectral.base.yaml', 'r') as base_file:
    base_content = base_file.read()

with open('spectral.yaml', 'w') as new_file:
    new_file.write(base_content)
    for block in spectral_blocks:
        indented_block = '\n'.join('  ' + line for line in block.split('\n'))
        new_file.write(indented_block)
    print("Spectral rules merged.")