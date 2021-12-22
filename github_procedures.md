## Github Procedures
Before commiting any changes to the repo
- create a branch off of main
- when the changes are finshed being made to the branch, create a pr request to merge your work branch into main, not production.
- Never merge to production directly
- request reviewers before merging into staging unless given permission by leads
- Address reviewer concerns then merge into staging once everything is cleared

**Reminder: the only branch that is allowed to be merged into main is the staging branch**
This ensures that the code can be tested before going onto the production branch

When merging from main to production
- Make a pr request
- have 2 reviewers *fully* test out the website
- reslove any errors by creating a new branch off of main. 
- Once reviewers approve, okay changes with leads before going ahead
- Note: only approved members can push to production

Main is also a protect branch
- Contains most recent builds of pyrenote
- PRs to main require 1 reviewer
- Creating working branches off of main, not production

If there is a unrelated bug to your work, create an issue post on the github to be resloved at a later date

**Security Notes**
Don't post passwords, usernames, or url on the repo as this is a security risk
Also don't push the file /audino/.env to the repo. 
If this happens, no worries. Lets the leads know so we can change the password.