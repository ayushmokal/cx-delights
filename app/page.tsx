"use client";

import { useEffect, useRef, useState } from 'react';

type FormState = {
  ticketLink: string;
  productLink: string;
  occasion: string;
  agentName: string;
};

function isUrl(s: string) {
  try { new URL(s); return true; } catch { return false; }
}

// Simple confetti: lightweight canvas burst
function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      const c = document.createElement('canvas');
      c.id = 'confetti-canvas';
      document.body.appendChild(c);
    }
    return () => {};
  }, []);

  const burst = () => {
    const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { innerWidth:w, innerHeight:h } = window;
    canvas.width = w; canvas.height = h;
    const N = 120;
    const parts = Array.from({length:N}, () => ({
      x: w/2, y: h/2, r: 4+Math.random()*4,
      dx: (Math.random()*2-1)*6,
      dy: -Math.random()*6-4,
      color: ['#ffffff','#e5e7eb','#a3a3a3'][Math.floor(Math.random()*3)],
      life: 60 + Math.random()*40
    }));
    let frame = 0;
    const tick = () => {
      frame++;
      ctx.clearRect(0,0,w,h);
      parts.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        p.dy += 0.2; // gravity
        p.life -= 1;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      });
      if (frame < 120) requestAnimationFrame(tick); else ctx.clearRect(0,0,w,h);
    };
    requestAnimationFrame(tick);
  };
  return { burst, canvasRef };
}

export default function Page() {
  const [form, setForm] = useState<FormState>({ ticketLink: '', productLink: '', occasion: '', agentName: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; } | null>(null);
  const { burst } = useConfetti();

  const allValid =
    isUrl(form.ticketLink) &&
    isUrl(form.productLink) &&
    form.occasion.trim().length > 1 &&
    form.agentName.trim().length > 1;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allValid) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setResult({ ok: true, message: 'Submission received. Thank you! 🎉' });
        burst();
        setForm({ ticketLink: '', productLink: '', occasion: '', agentName: '' });
      } else {
        setResult({ ok: false, message: json?.error || 'Submission failed. Please try again.' });
      }
    } catch (err: any) {
      setResult({ ok: false, message: err?.message || 'Network error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      {/* Background ornaments */}
      <div className="bg" aria-hidden>
        <div className="orb large" style={{top:-60, left:-80}} />
        <div className="orb medium" style={{bottom:-40, right:-60, animationDelay:'-3s'}} />
        <div className="orb small" style={{top:200, right:-40, animationDelay:'-6s'}} />
      </div>
      <div className="card">
        <span className="badge">CX · Delights</span>
        <h1>External Delights Submission</h1>
        <p className="small">We’re restarting External Delights — quick gifts when customers mention birthdays, wins, or special moments in chat/email. Budget: up to ₹3,000 (≈ $35) per customer; submissions are reviewed EOD.</p>

        {/* examples removed by request */}
        <form onSubmit={onSubmit}>
          <label htmlFor="ticket">Ticket Link (Email/Chat)</label>
          <input id="ticket" type="url" placeholder="https://..." required value={form.ticketLink}
                 onChange={(e)=>setForm(f=>({...f, ticketLink:e.target.value}))} />
          <p className="hint">Paste the direct permalink to the conversation or ticket where the moment is mentioned. Avoid screenshots or shortened URLs.</p>

          <label htmlFor="product">Product Link</label>
          <input id="product" type="url" placeholder="https://www.amazon.in/..." required value={form.productLink}
                 onChange={(e)=>setForm(f=>({...f, productLink:e.target.value}))} />
          <p className="hint">Link to a single item page within ₹3,000 (≈ $35). No carts or search results; neutral, practical items are preferred.</p>

          <div className="row">
            <div>
              <label htmlFor="occasion">Occasion</label>
              <input id="occasion" type="text" placeholder="Birthday / New baby / Promotion / Achievement"
                     required value={form.occasion}
                     onChange={(e)=>setForm(f=>({...f, occasion:e.target.value}))} />
              <p className="hint">One short phrase that captures the moment (e.g., “Birthday”, “Milestone unlocked”, “New baby”).</p>
            </div>
            <div>
              <label htmlFor="agent">Your Name</label>
              <input id="agent" type="text" placeholder="Agent name" required value={form.agentName}
                     onChange={(e)=>setForm(f=>({...f, agentName:e.target.value}))} />
              <p className="hint">Used for attribution on the sheet. Please use your full name.</p>
            </div>
          </div>

          <div style={{display:'flex', gap:12, marginTop:18}}>
            <button className="btn" type="submit" disabled={!allValid || submitting}>
              {submitting ? 'Submitting…' : 'Submit Delight'}
            </button>
          </div>
        </form>
        {result && (
          <p className={result.ok ? 'success' : ''} style={{marginTop:12}}>{result.message}</p>
        )}
        <details className="panel">
          <summary>Delight Guidelines</summary>
          <div className="content">
            <ul>
              <li><b>Budget:</b> Up to ₹3,000 (≈ $35) per customer. Exceptions need lead approval.</li>
              <li><b>Timing:</b> Submit when customers mention birthdays, wins, or similar moments in chat/email.</li>
              <li><b>Volume:</b> Aim for 10–20 delights per month to keep the habit alive.</li>
              <li><b>Fulfilment:</b> Requests are batched and processed EOD via Amazon or regional retailers.</li>
              <li><b>Items:</b> Favor neutral, useful items. Avoid sizing‑specific apparel, personalized goods, or gift cards unless approved.</li>
              <li><b>Links:</b> Paste a clean product URL (no cart or referral links). Regional storefronts are fine.</li>
              <li><b>Privacy:</b> Don’t include addresses or extra PII here—only the ticket link. Logistics are handled separately.</li>
              <li><b>Review:</b> Submissions may be adjusted or declined if they fall outside policy.</li>
            </ul>
          </div>
        </details>
      </div>
    </div>
  );
}
