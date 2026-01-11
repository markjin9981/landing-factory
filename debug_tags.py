
import re

def check_balance(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    stack = []
    
    # Regex for tags
    # Captures: 1=ClosingSlash, 2=TagName, 3=SelfClosingSlash
    tag_re = re.compile(r'<(/)?([a-zA-Z0-9\-\.]+)(?:[^>]*?(/)?)?>')
    
    for i, line in enumerate(lines):
        # Remove comments logic (simple)
        # TODO: Handle multi-line comments properly if needed, but for JSX usually {/* */}
        # We'll just strip {/* ... */}
        clean_line = re.sub(r'\{\/\*.*?\*\/\}', '', line)
        
        matches = tag_re.finditer(clean_line)
        for match in matches:
            is_close = match.group(1) == '/'
            tag_name = match.group(2)
            is_self = match.group(3) == '/'

            if tag_name in ['img', 'input', 'br', 'hr', 'col', 'source']: # Void elements
                continue
            
            if is_self:
                continue

            if is_close:
                if not stack:
                    print(f"Error: Unexpected closing tag </{tag_name}> at line {i+1}")
                    return
                last = stack[-1]
                if last['tag'] != tag_name:
                    print(f"Error: Mismatched closing tag. Expected </{last['tag']}>, found </{tag_name}> at line {i+1}. Opened at line {last['line']}")
                    # Don't return, try to recover or show context
                else:
                    stack.pop()
            else:
                stack.append({'tag': tag_name, 'line': i+1})

    if stack:
        print("Error: Unclosed tags at EOF:")
        for item in stack[-5:]: # Show last 5
            print(f"  <{item['tag']}> at line {item['line']}")

check_balance('pages/Admin/LandingEditor.tsx')
