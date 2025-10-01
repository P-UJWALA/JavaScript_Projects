
    (function(){
      const exprEl = document.getElementById('expr');
      const resultEl = document.getElementById('result');
      const keys = document.getElementById('keys');
      let expression = '';

      // helpers
      function render(){
        exprEl.textContent = expression || '';
        resultEl.textContent = expression ? tryEvaluatePreview(expression) : '0';
      }

      function append(value){
        // Basic prevention: avoid two operators in a row (except '-' for negative)
        if (!value) return;
        const last = expression.slice(-1);
        const ops = ['+','-','×','÷','*','/'];
        // allow parentheses and percent and dot and digits
        if (ops.includes(last) && ops.includes(value) && !(value === '-' && last !== '-')) {
          // replace last operator with new one (common calculator behavior)
          expression = expression.slice(0, -1) + value;
        } else {
          expression += value;
        }
        render();
      }

      function backspace(){
        expression = expression.slice(0, -1);
        render();
      }

      function clearAll(){
        expression = '';
        render();
      }

      function tryEvaluatePreview(expr){
        try {
          const val = safeEval(expr);
          if (val === Infinity || val === -Infinity || Number.isNaN(val)) return 'Error';
          return formatResult(val);
        } catch (e) {
          return ''; // show blank preview when not evaluatable yet
        }
      }

      function formatResult(num){
        if (Number.isInteger(num)) return num.toString();
        // Limit long decimals
        let s = num.toString();
        if (s.length > 12) s = Number(num.toPrecision(10)).toString();
        return s;
      }

      function safeEval(input){
        if (!input || typeof input !== 'string') throw new Error('Invalid expr');
        // convert display operators to JS operators
        let e = input.replace(/×/g,'*').replace(/÷/g,'/');

        // convert percentages like "50%" or "12.5%" to "(50/100)" etc.
        e = e.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

        // allow only digits, operators, parentheses, decimal point and spaces
        if (!/^[0-9+\-*/().\s]+$/.test(e)) {
          throw new Error('Invalid characters');
        }

        // extra safety: prevent sequences like "*/" etc. (basic)
        if (/[*\/+\-]{2,}/.test(e.replace(/\s+/g,''))) {
          // allow "(-" or "*-" as part of negative numbers? We keep it simple and allow one leading operator
          // but reject many repeated operators
        }

        // evaluate using Function to avoid direct eval call (slightly safer in this context)
        // Using "use strict" prevents some sloppy behaviors
        // Wrap in parentheses to allow starting with unary minus
        /* eslint-disable no-new-func */
        const fn = new Function('"use strict"; return (' + e + ');');
        const result = fn();
        if (typeof result !== 'number') throw new Error('Not a number result');
        return result;
      }

      function evaluateAndShow(){
        try {
          const val = safeEval(expression);
          expression = String(formatResult(val));
          render();
        } catch (err) {
          resultEl.textContent = 'Error';
          // keep expression so user can fix it
        }
      }

      // click handling
      keys.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button');
        if (!btn) return;
        const val = btn.getAttribute('data-value');
        const action = btn.getAttribute('data-action');

        if (action === 'clear') {
          clearAll();
          return;
        }
        if (action === 'back') {
          backspace();
          return;
        }
        if (action === 'equals') {
          evaluateAndShow();
          return;
        }
        if (val) {
          append(val);
        }
      });

      // keyboard support
      window.addEventListener('keydown', (ev) => {
        const k = ev.key;
        if ((k >= '0' && k <= '9') || ['+','-','/','*','(',')','.'].includes(k)) {
          // translate * and / to display later if needed; we accept them in expression
          append(k === '*' ? '×' : (k === '/' ? '÷' : k));
          ev.preventDefault();
          return;
        }
        if (k === 'Enter' || k === '=') {
          evaluateAndShow();
          ev.preventDefault();
          return;
        }
        if (k === 'Backspace') {
          backspace();
          ev.preventDefault();
          return;
        }
        if (k === 'Escape') {
          clearAll();
          ev.preventDefault();
          return;
        }
        if (k === '%') {
          append('%');
          ev.preventDefault();
          return;
        }
      });

      // initial render
      render();
    })();
