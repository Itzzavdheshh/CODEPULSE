import re
from typing import Dict, Any, List, Tuple, Optional

class Preprocessor:
    """
    Preprocessing Engine for CodePulse Compiler.
    Handles comment extraction (single-line // and multi-line /* */) with string-literal protection,
    preserves original line mappings, and executes token-aware macro (#define) expansions.
    """
    def preprocess(self, source_code: str) -> Dict[str, Any]:
        # 1. Macro processing (#define NAME VALUE)
        macro_source, macros, macro_expansions = self.expand_macros(source_code)

        # 2. String-aware comment analysis
        cleaned_source, comment_stats = self.strip_comments(macro_source)

        return {
            "original_source": source_code,
            "macro_expanded_source": macro_source,
            "cleaned_source": cleaned_source,
            "macros": macros,
            "macro_expansions": macro_expansions,
            "comment_stats": comment_stats,
            # Convenience summary fields for frontend + tests
            "comments_removed": comment_stats["single_line_comments_count"] + comment_stats["block_comments_count"],
            "macros_defined": len(macros),
        }

    def expand_macros(self, code: str) -> Tuple[str, List[Dict[str, str]], List[str]]:
        macros: Dict[str, str] = {}
        macro_list: List[Dict[str, str]] = []
        expansions: List[str] = []
        output_lines = []

        lines = code.split('\n')
        macro_pattern = re.compile(r'^\s*#define\s+([A-Za-z_][A-Za-z0-9_]*)\s+(.+)$')

        for line in lines:
            match = macro_pattern.match(line)
            if match:
                name, value = match.group(1), match.group(2).strip()
                macros[name] = value
                macro_list.append({"name": name, "value": value})
                expansions.append(f"Defined Macro: {name} => {value}")
                # Replace define directive line with empty line to preserve line numbers
                output_lines.append("")
            else:
                output_lines.append(line)

        # Token-aware macro substitution in remaining code
        expanded_lines = []
        for line_num, line in enumerate(output_lines, 1):
            curr_line = line
            if macros and not line.strip().startswith("//") and not line.strip().startswith("/*"):
                for m_name, m_val in macros.items():
                    pattern = r'\b' + re.escape(m_name) + r'\b'
                    if re.search(pattern, curr_line):
                        new_line = re.sub(pattern, m_val, curr_line)
                        if new_line != curr_line:
                            expansions.append(f"Line {line_num}: Substituted '{m_name}' -> '{m_val}'")
                            curr_line = new_line
            expanded_lines.append(curr_line)

        return "\n".join(expanded_lines), macro_list, expansions

    def strip_comments(self, code: str) -> Tuple[str, Dict[str, Any]]:
        length = len(code)
        pos = 0
        cleaned_chars = []
        
        single_line_comments = 0
        block_comments = 0
        removed_chars = 0
        comment_lines_set = set()
        
        in_string = False
        string_char = ''
        
        line_num = 1
        
        while pos < length:
            ch = code[pos]

            if ch == '\n':
                line_num += 1
                cleaned_chars.append(ch)
                pos += 1
                continue

            # String literal protection: ignore comment characters inside strings
            if in_string:
                cleaned_chars.append(ch)
                if ch == string_char and (pos == 0 or code[pos-1] != '\\'):
                    in_string = False
                pos += 1
                continue

            if ch in ('"', "'"):
                in_string = True
                string_char = ch
                cleaned_chars.append(ch)
                pos += 1
                continue

            # Single-line comment: //
            if ch == '/' and pos + 1 < length and code[pos+1] == '/':
                single_line_comments += 1
                comment_lines_set.add(line_num)
                # Skip until end of line
                while pos < length and code[pos] != '\n':
                    removed_chars += 1
                    pos += 1
                continue

            # Multi-line comment: /* ... */
            if ch == '/' and pos + 1 < length and code[pos+1] == '*':
                block_comments += 1
                start_line = line_num
                pos += 2
                removed_chars += 2
                while pos < length:
                    if code[pos] == '\n':
                        line_num += 1
                        comment_lines_set.add(line_num)
                        cleaned_chars.append('\n') # Keep newlines for line mapping alignment
                        pos += 1
                        continue
                    if code[pos] == '*' and pos + 1 < length and code[pos+1] == '/':
                        pos += 2
                        removed_chars += 2
                        break
                    comment_lines_set.add(line_num)
                    removed_chars += 1
                    pos += 1
                continue

            cleaned_chars.append(ch)
            pos += 1

        cleaned_text = "".join(cleaned_chars)
        
        return cleaned_text, {
            "single_line_comments_count": single_line_comments,
            "block_comments_count": block_comments,
            "total_comment_lines": len(comment_lines_set),
            "removed_characters": removed_chars,
            "comment_lines": sorted(list(comment_lines_set))
        }
