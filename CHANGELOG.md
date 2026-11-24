# nex

## 1.0.0

### Major Changes

- 6bc6d92: Nex 1.0 is here: run Claude Code on many tasks at once, each in its own worktree with its own environment.

### Minor Changes

- 8a5d12b: Claude now knows where your task's environment runs, so it tests against the right services instead of starting its own.
- 927d776: Claude's questions and plans now show up as cards you can answer and approve right in the task.
- 927d776: New toasts tell you when a task you are not looking at needs you, finishes or stops, with buttons to answer, review the changes or restart it.
- 6135890: Adding a project now lists the git repos found on your Mac, and lets you clone one from GitHub or from a git URL without leaving Nex.
- 927d776: New: press Cmd+K to jump to any task, mention a file from the task you are in, or run common actions.
- 6135890: You can now add a server to a project from the connectors menu in the composer.
- 8a5d12b: New option to continue a conversation you started in Claude Code as a Nex task, from the new task box.
- 927d776: New: dictate messages to Claude with the microphone button or Option+Space, in the language and microphone you pick.
- 8a5d12b: Database and mail ports of the task you're viewing now answer on your Mac, so TablePlus or `psql` on `localhost:5432` reach that task's database.
- 8a5d12b: Every address in a task's environment menu now opens at localhost in one click, where signing in works like it always did.
- 8a5d12b: Task environments now open at short `.nex` addresses without a port, like `django.fix-login.nex`, with a `.localhost` link next to each one for browsers that skip them.
- a925d6b: New environments step in onboarding: we install Apple container and set up .nex addresses on your Mac in about half a minute, so each task can soon run its services in its own containers.
- 927d776: New: press Cmd+F in a task to search the conversation and jump between matches.
- 8a5d12b: The home screen now greets you with an animated sea that follows the time of day, and you can describe a task right there to start it.
- 927d776: The model picker now lists the models your Claude Code offers, and only shows effort and Auto mode for models that support them.
- 927d776: New shortcuts to jump to the next or previous task and to open the usage panel.
- 64cfa7f: Nex has a new look, starting with a fresh home screen and titlebar.
- 927d776: Notifications can now play a sound, show a macOS banner when Nex is in the background and put a badge on the Dock icon.
- 927d776: Tasks can now be opened in your editor or terminal app from their menu.
- 8a5d12b: The home overview now shows the day at a glance (tasks by state, spend, your usage limit and environments), and the full task cards moved to their own Tasks view in the sidebar.
- 6135890: The command palette now finds your projects, so you can start a new task in one without leaving the keyboard.
- a925d6b: New "Build and test" button in a project’s environment that builds what’s missing, starts every service once to make sure it runs, then cleans up.
- a925d6b: Nex now detects the services each project needs, builds the ones that come from the project's own Dockerfiles, and lets you edit them when you add or edit a project.
- a925d6b: New prepare steps in a project's environment, with migrations and seeds found for you, that every task runs to migrate and fill its own databases.
- 6135890: Project settings now apply to new tasks: they start from the base branch you chose, pull it first if you asked to, copy your files into the worktree and run the install and setup script in a Setup terminal.
- 927d776: You now get a toast when a task you are not looking at pushes its branch or opens a pull request, with a link to the pull request.
- 6135890: Quick commands on a task now show running ones first, with the local port they serve and how long they have been up, and list the commands Claude started in the background.
- 8a5d12b: Ultracode in tasks now fans the work out to parallel agents and cross-checks them, instead of only raising the effort.
- 927d776: Tasks on the home strip can now be made wider by dragging their right edge; double-click the edge to reset.
- 6135890: You can now add a workspace from settings, and rename it, change its color and badge or remove it from its card.
- a925d6b: New Environments section in settings to see Apple container and .nex addresses at a glance, repair or restart them, choose how much memory environments may use, or remove them, with that memory shown in the sidebar.
- 6135890: New option in settings to import projects from GitHub straight into a workspace.
- 927d776: New Settings page, opened from the gear in the titlebar or with ⌘, — theme, interface size, notifications, shortcuts, accounts, defaults for new tasks, terminal, diff, dictation and usage alerts.
- 8a5d12b: Tasks now show the agents and workflows Claude starts, with their progress live, a full view of what each agent did, and a way to stop any of them.
- 8a5d12b: Each task's apps now open on their own address in any browser, and its frontend reaches its own backend like it does on localhost.
- 8a5d12b: Each task now starts its own environment, with fresh databases that it migrates and fills from its own code.
- 8a5d12b: New option to create a task without starting its environment, and start it later from the task when you need it.
- 6135890: When a task hits its usage limit, you can continue it on another account that still has room, or ask Nex to tell you when the limit resets.
- 927d776: Nex now warns you when an account is close to its usage limit, with how long you have left and an option to use another account for new tasks.
- 6135890: Workspaces can now use an icon as their badge, alongside the initial or an image.

### Patch Changes

- a925d6b: We fixed an issue where adding or editing a project could grow taller than the window and hide its buttons.
- 927d776: Tasks now show more of what Claude does: search matches, files found, web results, images, commits, pull requests, subagents and how long each command took.
- 927d776: We fixed command output in tasks so long lines scroll, extra lines expand and it opens in a terminal.
- 927d776: Messages you send while Claude is working now wait in line, and you can send, edit or cancel them.
- 927d776: Tasks now warn you when the context is almost full, when Claude retries the API, when it hits a usage limit or stops unexpectedly.
- 6135890: We improved the task chat: your sent messages keep their file, link and pasted text cards, code blocks show their file name, notes stand out, attached images keep their names, and recently used files are suggested first.
- 6135890: In tasks, Esc now denies a pending permission, ⇧⇥ cycles the permission mode, running tools show how long they have been running, and a new task invites you to describe it.
- 927d776: Nex now warns you when your Claude Code is too old and can update it for you, from the warning or from settings.
- 927d776: Nex now asks before quitting while agents are still working.
- 927d776: New options in the connectors menu to sign in to a connector that asks for it and to remove one that keeps failing.
- 6135890: New shortcut from the connectors menu to manage your Claude connectors.
- 927d776: Every task now shows its context use right away, and usage explains when an account's sign-in has expired.
- 927d776: The context indicator in tasks now matches what Claude reports, and hovering it shows what is using the context.
- f342401: We fixed a flicker at the top of the conversation when switching back to the Agent tab.
- 927d776: When a task cannot be created, the toast now shows the exact error with buttons to try again or copy it.
- 6135890: You can now pick the account, model and permission mode of your first task during setup, and ⌘0 and Enter in the workspace peek now work.
- 927d776: Dictation now shows a loader while the microphone is starting, so you know when to begin speaking.
- a925d6b: We redesigned the project environment editor so services are easier to scan and edit.
- 8a5d12b: We made apps in task environments reload as soon as you or Claude change a file.
- 8a5d12b: We now pause environments nobody has used for a while to free memory, and resume them when you open the task.
- 8a5d12b: We fixed an issue where a task's environment address could get an extra number, like `-2`, that it didn't need.
- 8a5d12b: We made creating a task much faster in projects with submodules.
- 927d776: We made terminals faster to draw and to switch between, even with many shells open across tasks.
- 8a5d12b: New Home background option in Settings › Appearance to keep the overview at dawn, day, dusk or night, follow the time of day, or turn the scene off.
- 927d776: Images you attach now show above your message and open in a viewer with arrows to move between them.
- 927d776: We fixed an issue where switching tabs in a task cleared the message you were writing.
- 6135890: Paths, branches, tabs and other details now use the regular font, keeping the code font for code and commands.
- 6135890: We fixed menus that opened far from their button inside dialogs.
- 8a5d12b: We fixed the model menu running past the edge of the window when there are many models.
- 8a5d12b: We fixed the model menu showing descriptions instead of model names with newer versions of Claude Code.
- 8a5d12b: We fixed an issue where moving through a menu opened from another menu also highlighted the menu behind it.
- 8a5d12b: We refreshed the dark theme with deeper, neutral blacks instead of warm grays.
- 5606f92: Nex has a new app icon.
- 927d776: We fixed an issue where notes typed right before switching tabs were lost.
- 927d776: We fixed Send to Claude in task notes, which now sends your notes to the agent.
- a925d6b: The environments step in onboarding now shows the services found in your project, and Edit opens them.
- 6135890: New option to skip setup during onboarding and go straight to the app.
- 6135890: New command palette action to open the current task in the editor you chose in settings.
- 7101695: We fixed missing fonts and syntax colors in the installed app.
- 927d776: In tasks, press the up arrow in an empty reply box to bring back your earlier messages.
- 927d776: Tasks now tell you when you are offline or when a conversation is old, with quick ways to resume or start fresh.
- 6135890: You can now choose which Claude Code installation Nex uses from settings, and we check that it runs before switching.
- 927d776: Shell-only tasks now open on their terminal instead of an empty agent view.
- 8a5d12b: The sidebar and title bar are now translucent on the home screen, so the scene shows softly through them.
- 8a5d12b: We separated the overview from your task list in the sidebar.
- 927d776: Claude accounts whose sign-in had expired now renew on their own, and signing in again in settings renews the account instead of saying it already exists.
- 7101695: The Mac app is now less than half the download size, and its permission prompts explain why Nex needs the microphone and your folders.
- 927d776: You can now drop files anywhere on a task to attach them.
- 8a5d12b: New tasks now bring along the private env files of your project, so their environments start with the same settings as your main checkout.
- 8a5d12b: We fixed an issue where a new task could briefly show another conversation from the same folder.
- 927d776: New shortcuts: Cmd+1–9 jumps to a task and Control+1–4 switches its tabs.
- 927d776: Terminal tabs that do not fit now collapse into a "+N" menu.
- 927d776: In tasks, you can now start typing anywhere and the reply box picks it up.
- 927d776: The usage panel now shows the spend, daily trend and tasks of the account you pick.
- 927d776: Usage now shows your weekly limit when your plan has no session limit, instead of an empty session.
