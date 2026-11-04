#!/usr/bin/env node
// PreToolUse guard for the org's departments (.claude/agents/*.md, every role except chief-of-staff).
// Wired through each agent's `hooks:` frontmatter on the Bash tool. It reads the hook JSON on stdin
// and exits 2 (block, reason on stderr) when a command would change something outside the agent's
// own output file: git history, GitHub, Jira or Confluence over REST, a deploy, or bin/sync's push.
//
// It is a seatbelt, not a sandbox. Write and Edit stay available for the role's output file, and a
// determined script could still get around a regex. The role prompts and CLAUDE.md are the rule;
// this catches the slips. Only the chief of staff commits, and only JP posts.
//
//   echo '{"tool_name":"Bash","tool_input":{"command":"git push"}}' | node department-guard.mjs; echo $?

import { readFileSync } from 'node:fs';

let input = {};
try {
  input = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0); // unreadable input: do not block the session over the guard itself
}
if (input.tool_name && input.tool_name !== 'Bash') process.exit(0);
const command = String(input?.tool_input?.command ?? '');
if (!command.trim()) process.exit(0);

// Split into simple commands so a flag in one segment (cut -d,) is not read as another's (curl -d).
const segments = command
  .split(/\n|&&|\|\||;|\||\$\(|`/)
  .map((s) => s.trim().replace(/^(\(|\{)\s*/, ''))
  .map((s) => s.replace(/^(?:[A-Za-z_][A-Za-z0-9_]*=(?:'[^']*'|"[^"]*"|\S*)\s+)+/, '')) // FOO=bar cmd
  .map((s) => s.replace(/^(?:sudo|env|command|exec|nohup|time)\s+/, ''))
  .filter(Boolean);

const GIT_WRITE =
  /^git\b(?:\s+(?:-C|-c|--git-dir|--work-tree)\s*=?\s*\S+)*\s+(commit|push|merge|rebase|reset|cherry-pick|revert|am|apply|stash|clean|tag|checkout|switch|restore|add|rm|mv|filter-branch|filter-repo|update-ref|notes|replace)\b/;
const GIT_BRANCH_WRITE = /^git\b(?:\s+(?:-C|-c)\s*\S+)*\s+branch\b.*\s(-d|-D|-m|-M|--delete|--move|-f|--force)\b/;
const GH_WRITE =
  /^gh\s+(pr|issue|release|repo|label|workflow|run|secret|variable|gist|project|ruleset|cache)\s+(create|comment|review|merge|edit|close|reopen|ready|delete|lock|unlock|transfer|pin|unpin|develop|fork|rename|archive|unarchive|set|enable|disable|rerun|cancel|upload|sync|add|remove|link|unlink)\b/;
const WRITE_METHOD = /(?:-X|--request|--method)\s*=?\s*['"]?(POST|PUT|PATCH|DELETE)\b/i;
const GET_METHOD = /(?:-X|--method)\s*=?\s*['"]?GET\b/i;
const GH_API_BODY = /\s(?:-f|-F|--field|--raw-field|--input)(?:\s|=)/;
const CURL_BODY = /\s(?:-d|--data|--data-raw|--data-binary|--data-urlencode|--json|-F|--form|-T|--upload-file)(?:\s|=|$)/;
const DEPLOY =
  /^(?:heroku\s+(?:config:set|config:unset|config:add|run|ps:scale|ps:restart|ps:stop|releases:rollback|addons:|access:|pg:reset|pg:push|maintenance:on|features:enable|features:disable)|railway\s+(?:up|deploy|redeploy|down|variables\s+--set|variable\s+set)|kubectl\s+(?:apply|delete|patch|scale|edit|rollout)|terraform\s+(?:apply|destroy)|aws\s+\S+\s+(?:put|delete|create|update)-)/;
const SYNC_PUSH = /(?:^|\/)bin\/sync\b(?!\s+(?:status|--hook))/;
const WORKSIGHT_POSTERS = /(?:^|\/)bin\/(?:gh-attach|jira-post|jira-comment)\b/;

const reasons = [];
for (const seg of segments) {
  if (GIT_WRITE.test(seg) || GIT_BRANCH_WRITE.test(seg))
    reasons.push(`git write (${seg.slice(0, 60)}): departments never change git history; the chief of staff commits`);
  if (GH_WRITE.test(seg)) reasons.push(`GitHub write (${seg.slice(0, 60)}): only JP posts to GitHub`);
  if (/^gh\s+api\b/.test(seg) && (WRITE_METHOD.test(seg) || (GH_API_BODY.test(seg) && !GET_METHOD.test(seg))))
    reasons.push(`gh api write (${seg.slice(0, 60)}): GET only; add -X GET when passing -f query fields`);
  if (/^curl\b/.test(seg) && (WRITE_METHOD.test(seg) || CURL_BODY.test(seg)))
    reasons.push(`curl write (${seg.slice(0, 60)}): REST reads only; only JP posts to Jira or GitHub`);
  if (DEPLOY.test(seg)) reasons.push(`deploy or config change (${seg.slice(0, 60)}): release-devex drafts runbooks, people run them`);
  if (SYNC_PUSH.test(seg)) reasons.push(`bin/sync commits and pushes; use "bin/sync status" (the chief of staff runs the push)`);
  if (WORKSIGHT_POSTERS.test(seg)) reasons.push(`posting script (${seg.slice(0, 60)}): only JP posts`);
}

if (reasons.length) {
  process.stderr.write(
    `Blocked by the department guard (.claude/hooks/department-guard.mjs):\n- ${[...new Set(reasons)].join('\n- ')}\n` +
      'Write your finding or draft into your output file instead, and name the step for JP in the Hand-off section.\n',
  );
  process.exit(2);
}
process.exit(0);
