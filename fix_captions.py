import os
import re

export_dir = r'd:\Kshipa\Trial hmi\Export import'
count = 0

for filename in os.listdir(export_dir):
    if filename.endswith('.xml'):
        filepath = os.path.join(export_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
        except UnicodeDecodeError:
            with open(filepath, 'r', encoding='utf-16') as f:
                content = f.read()
        
        # Replace navy transparent with gainsboro solid for black captions
        new_content = re.sub(
            r'(<caption[^>]*?color="black")( backColor=")navy(" backStyle=")transparent(")',
            r'\1\2gainsboro\3solid\4',
            content
        )
        
        if content != new_content:
            try:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
            except:
                with open(filepath, 'w', encoding='utf-16') as f:
                    f.write(new_content)
            print(f'{filename} - fixed')
            count += 1

print(f'\nTotal files updated: {count}')
