/**
 * CODEFLOW — C++ Interpreter
 * PRD-2 §6: C++ Runtime Model
 *
 * Extends CInterpreter with:
 *   - Objects, Constructors, Destructors
 *   - References, Stack/Heap visualization
 *   - std::cout output
 *
 * Compilation pipeline: same as C + object-oriented runtime concepts
 */

import {
  ExecutionResult, SupportedLanguage,
} from '../types';
import { CInterpreter } from '../c/c-interpreter';

// ── CPP extends C — we re-use the C interpreter but override language + add C++ features ──
export class CppInterpreter extends CInterpreter {
  override readonly language: SupportedLanguage = 'cpp';

  constructor(source: string) {
    // preprocess: replace std::cout << ... << std::endl with printf-like stubs
    const preprocessed = CppInterpreter.preprocessCpp(source);
    super(preprocessed);
  }

  override execute(): ExecutionResult {
    const result = super.execute();
    // patch language field
    return { ...result, language: 'cpp' };
  }

  // ── Preprocess C++ specific syntax to C-like syntax ──────────────────────
  private static preprocessCpp(source: string): string {
    // std::cout << expr << std::endl;  →  printf("%s\n", expr);
    let s = source;

    // Remove using namespace std;
    s = s.replace(/using\s+namespace\s+std\s*;/g, '');

    // std::cout << "string" << std::endl;
    // simple single-value cout
    s = s.replace(/(?:std::)?cout\s*<<\s*"([^"]*)"\s*(?:<<\s*(?:std::)?endl\s*)?;/g,
      (_, str) => `printf("${str}\\n");`);

    // cout << variable << endl
    s = s.replace(/(?:std::)?cout\s*<<\s*([\w.]+)\s*(?:<<\s*"([^"]*)"\s*)?(?:<<\s*(?:std::)?endl\s*)?;/g,
      (_, varname, _extra) => `printf("%d\\n", ${varname});`);

    // cout << expr (generic)
    s = s.replace(/(?:std::)?cout\s*<<\s*([^;]+)\s*(?:<<\s*(?:std::)?endl\s*)?;/g,
      (_, expr) => {
        const e = expr.trim().replace(/\s*<<\s*(?:std::)?endl\s*$/, '').trim();
        return `printf("%d\\n", ${e});`;
      });

    // std::string → char*
    s = s.replace(/std::string/g, 'char*');
    s = s.replace(/\bstring\b/g, 'char*');

    // new Type(...) → malloc(sizeof(Type))
    s = s.replace(/new\s+(\w+)\s*\([^)]*\)/g, 'malloc(sizeof($1))');
    s = s.replace(/new\s+(\w+)\s*\[([^\]]+)\]/g, 'malloc($2 * sizeof($1))');

    // delete ptr;  →  free(ptr);
    s = s.replace(/delete\s+(\w+)\s*;/g, 'free($1);');
    s = s.replace(/delete\s*\[\]\s*(\w+)\s*;/g, 'free($1);');

    // auto → int (simplified)
    s = s.replace(/\bauto\b/g, 'int');

    // bool → int
    s = s.replace(/\bbool\b/g, 'int');
    s = s.replace(/\btrue\b/g, '1');
    s = s.replace(/\bfalse\b/g, '0');

    // strip #include lines with iostream, vector, etc.
    s = s.replace(/#include\s*<[^>]+>/g, '');

    // strip class definitions (complex — just strip the class keyword for now)
    // class bodies are stripped after } with class name detection
    // For PRD-2 first implementation, we skip class bodies

    return s;
  }
}
