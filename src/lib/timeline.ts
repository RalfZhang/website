import { useEffect, useRef } from "react";

/** Resolves after `ms` of play time: while the timeline is paused, so is the wait. */
export type Wait = (ms: number) => Promise<void>;

/** `ms`, give or take 40%: the uneven pace of someone typing. */
const jitter = (ms: number) => ms * (0.6 + Math.random() * 0.8);

/**
 * `text` typed out a character at a time, about `ms` apart: `show` is handed
 * what's typed so far after each. A character is a code point, so an emoji
 * comes in whole rather than as half a surrogate pair.
 */
export async function typeOut(wait: Wait, text: string, ms: number, show: (typed: string) => void) {
  const chars = Array.from(text);
  for (let i = 1; i <= chars.length; i++) {
    show(chars.slice(0, i).join(""));
    await wait(jitter(ms));
  }
}

type Timer = { left: number; since: number; id: number; done: () => void };

/**
 * The time a scripted animation runs on. Every wait handed out counts down only
 * while the clock plays, so pausing it stops a script mid-step and playing it
 * again carries on from there. Once stopped, its waits never resolve and the
 * scripts waiting on them are simply dropped.
 */
class Clock {
  private playing = false;
  private timers = new Set<Timer>();

  wait: Wait = (ms) =>
    new Promise((done) => {
      const t: Timer = { left: ms, since: 0, id: 0, done };
      this.timers.add(t);
      if (this.playing) this.arm(t);
    });

  private arm(t: Timer) {
    t.since = performance.now();
    t.id = window.setTimeout(() => {
      this.timers.delete(t);
      t.done();
    }, t.left);
  }

  play() {
    if (this.playing) return;
    this.playing = true;
    this.timers.forEach((t) => this.arm(t));
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    const now = performance.now();
    this.timers.forEach((t) => {
      clearTimeout(t.id);
      t.left = Math.max(0, t.left - (now - t.since));
    });
  }

  stop() {
    this.pause();
    this.timers.clear();
  }
}

/**
 * Runs `script` from the first time `playing` is true, pausing it whenever
 * `playing` turns false and resuming it when it's back, so a scripted demo
 * picks up where it was left rather than starting over. The script must time
 * itself with the `wait` it's handed, and is captured as it is when it starts:
 * anything it reads later that can change belongs in a ref. Dropped on unmount.
 * A script that throws is reported and ends there; `onError` (captured with it)
 * is for putting up whatever it was still to show.
 */
export function useTimeline(playing: boolean, script: (wait: Wait) => Promise<unknown>, onError?: () => void) {
  const clock = useRef<Clock | null>(null);

  useEffect(
    () => () => {
      clock.current?.stop();
      clock.current = null;
    },
    [],
  );

  useEffect(() => {
    if (!playing) return;
    if (!clock.current) {
      clock.current = new Clock();
      script(clock.current.wait).catch((e: unknown) => {
        reportError(e);
        onError?.();
      });
    }
    const c = clock.current;
    c.play();
    return () => c.pause();
  }, [playing]); // not `script`: it's captured when it starts (see above), not re-run when it changes
}
