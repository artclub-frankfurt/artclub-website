---
description: Close registration on an event and open a PR with the change.
argument-hint: <event slug or filename fragment>
---

Close registration on the event matching: `$ARGUMENTS`

Walk through these steps in order. If a step fails, stop and report the problem instead of pushing through.

1. **Verify clean tree.** Run `git status --porcelain`. If non-empty, stop and ask the user to commit or stash before continuing — this command will create its own branch and commit.

2. **Locate the event.** Search `src/content/events/` for a file whose filename or `title:` frontmatter matches `$ARGUMENTS` (case-insensitive substring). If zero matches: report and stop. If more than one: list them and ask the user which to close.

3. **Inspect frontmatter (read-only).** Read the matched file and decide:
   - If it already has `registrationClosed: true`, stop and tell the user nothing to do.
   - If it has `registrationClosed: false` (or any other value), the edit will replace that line with `registrationClosed: true`.
   - If the field is absent, the edit will insert `registrationClosed: true` on its own line immediately after the `lumaUrl:` line.

4. **Branch from latest main.** Run `git fetch origin main` then `git checkout -b chore/close-event-<slug> origin/main`, where `<slug>` is the event filename without the `.md` extension. If that branch already exists locally or remotely, append `-2`, `-3`, … until you find a free name.

5. **Apply the edit on the new branch.** Make the frontmatter change decided in step 3 to the matched event file, and nothing else.

6. **Commit.** Stage only the one event file. Commit message:
   ```
   content(events): close registration on <slug>

   Flips registrationClosed to true so the event detail page renders a
   disabled "Registration closed" button instead of the Luma link.
   ```

7. **Push and open PR.** `git push -u origin <branch>` then `gh pr create` with:
   - title: `Close registration on <slug>`
   - body (HEREDOC):
     ```
     ## Summary
     - Sets `registrationClosed: true` on `<event-file>` so the event detail page shows a disabled "Registration closed" button instead of the Luma link.

     ## Test plan
     - [ ] Visit the event detail page locally and confirm the CTA renders as a greyed-out "Registration closed" with no link.
     ```

8. **Report.** Print the PR URL and the path of the file that was changed.

Notes:
- Do not run `/simplify`, `/review`, or any other follow-up command unless the user asks.
- Do not modify any other event or any unrelated file.
- After the event date passes, `registrationClosed` becomes redundant — the page already disables the button automatically. This command is for closing registration *before* the date.
