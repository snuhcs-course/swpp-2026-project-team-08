# AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung
"""Run classification and merge, resuming saved results after HTTP 503 outages."""
import argparse
import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path


def run(folder, invoke=subprocess.run, pause=time.sleep):
    folder = folder.resolve()
    base = [sys.executable, '-u', '-m', 'data.ingredient_restrictions.run_workflow']

    def status(state, **extra):
        from .run_workflow import write
        write(folder / 'status.json', dict(state=state,
              updated_at=datetime.now(timezone.utc).isoformat(), **extra))

    for phase, command in [('classifying', ['run', '--run-dir', str(folder), '--passes', 'a', 'b']),
                           ('merging', ['reconcile', '--run-dir', str(folder)])]:
        retries = 0
        while True:
            status('running', phase=phase, retries_503=retries)
            # Stream stdout/stderr to disk: classify output can be large.
            attempt = folder / 'latest-attempt.log'
            with attempt.open('w') as log:
                result = invoke(base + command, stdout=log, stderr=subprocess.STDOUT)
            with (folder / 'run.log').open('a') as history:
                history.write(attempt.read_text())
            if result.returncode == 0:
                break
            if 'Gemini API returned HTTP 503;' not in attempt.read_text():
                status('failed', phase=phase, exit_code=result.returncode)
                return result.returncode
            retries += 1
            delay = min(300, 60 * 2 ** min(retries - 1, 3))
            status('retrying', phase=phase, reason='HTTP 503', retries_503=retries,
                   wait_seconds=delay)
            print(json.dumps({'state': 'retrying', 'reason': 'HTTP 503',
                              'wait_seconds': delay}), flush=True)
            pause(delay)
    status('complete')
    return 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run-dir', required=True, type=Path)
    sys.exit(run(parser.parse_args().run_dir))
