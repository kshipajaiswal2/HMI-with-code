import os
import json
import re

project_path = r'd:\Kshipa\Trial hmi\pc-hmi-runtime\projects\a\Gfx'
fixed_count = 0

for filename in os.listdir(project_path):
    if filename.endswith('.json'):
        filepath = os.path.join(project_path, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                screen_data = json.load(f)
            
            if not screen_data.get('overviewShell'):
                continue
            
            # Fix all OverviewNav_* buttons
            for nav_key in list(screen_data['overviewShell'].keys()):
                if nav_key.startswith('OverviewNav_'):
                    nav_button = screen_data['overviewShell'][nav_key]
                    # Fix transparent caption styling
                    if nav_button.get('captionBackStyle') == 'transparent':
                        nav_button['captionBackStyle'] = 'solid'
                        nav_button['useCaptionBackColor'] = True
                        nav_button['captionBackColor'] = '#dcdcdc'  # Match button background
                        print(f'{filename} - Fixed {nav_key}')
                        fixed_count += 1
            
            # Save the file
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(screen_data, f, indent=2)
        
        except (json.JSONDecodeError, IOError) as e:
            print(f'Error processing {filename}: {e}')

print(f'\nTotal navigation buttons fixed: {fixed_count}')
