# AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

from data.ingredient_restrictions.run_background import run


class BackgroundTests(unittest.TestCase):
    def test_503_waits_then_resumes_and_merges(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            waits, commands = [], []
            def invoke(command, stdout, stderr):
                commands.append(command)
                if len(commands) <= 4:
                    stdout.write('RuntimeError: Gemini API returned HTTP 503; check quota\n')
                    return SimpleNamespace(returncode=1)
                return SimpleNamespace(returncode=0)
            self.assertEqual(run(folder, invoke, waits.append), 0)
            self.assertEqual(waits, [60, 120, 240, 300])
            self.assertEqual(commands[0], commands[4])
            self.assertIn('reconcile', commands[-1])
            self.assertEqual(json.loads((folder / 'status.json').read_text())['state'], 'complete')

    def test_other_errors_stop_without_waiting_or_merging(self):
        with tempfile.TemporaryDirectory() as tmp:
            for error in ['HTTP 429', 'invalid bundle response after retries']:
                calls, waits = [], []
                def invoke(command, stdout, stderr):
                    calls.append(command)
                    stdout.write(error)
                    return SimpleNamespace(returncode=1)
                self.assertEqual(run(Path(tmp), invoke, waits.append), 1)
                self.assertEqual(len(calls), 1)
                self.assertEqual(waits, [])
