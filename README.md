## E4E Audio Labeling System

This project creates moment to moment or hard labels for audio data. If you are starting use the fallowing to get started!

**NOTE** Before making any changes to the code, make sure to create a branch to safetly make changes. Never commit directly to main.
**Read github_procedures.md for more detailed information before contributing to the repo** 

## Usage
***Note**: Before getting the project set up, message project leads for .env file. This file should be put in /audino **make sure the file is never pushed to the github***

Please install the following dependencies to run `audino` on your system:

1. [git](https://git-scm.com/) *[tested on v2.23.0]*
2. [docker](https://www.docker.com/) *[tested on v19.03.8, build afacb8b]*
3. [docker-compose](https://docs.docker.com/compose/) *[tested on v1.25.5, build 8a1c60f6]*

### Clone the repository

```sh
$ git clone https://github.com/UCSD-E4E/Audio_Labeling_System_AID.git
$ cd audino
```

**Note for Windows users**: Please configure git to handle line endings correctly as services might throw an error and not come up. You can do this by cloning the project this way:

```sh
$ git clone https://github.com/UCSD-E4E/Audio_Labeling_System_AID.git --config core.autocrlf=input
```

### For Development (Note this is the one we will test on and use)

**Note**: when running dev sever, hot reloading is enabled allowing you to simply save a file to make changes to the local sever. No need to bring down services!

**To build the services (do this when you frist start it), run:**

```sh
$ docker-compose -f docker-compose.dev.yml build
```

**To bring up the services, run:**
**NOte** Remember to cd into audino before starting
```sh
$ docker-compose -f docker-compose.dev.yml up
```
Then, in browser, go to [http://localhost:3000/](http://localhost:3000/) to view the application.

**To bring down the services, run:**

```sh
$ docker-compose -f docker-compose.dev.yml down
```
## Troubleshooting for starting docker

1) Docker containers do not even get a chance to start
  - Make sure docker is set up properly
  - Make sure docker itself has started. On windows check the system tray and hover over the icon to see the current status. Restart it if nessary
2) Backend crashes
  - For this error, check the top of the log. It should be complaining about /r charaters in the run-dev.sh files
  - The backend will crash if the endline charaters are not set to LF rather than CRLF
  - On VSCode, you can swap this locally via going into the file and chaning the CRLF icon in the bottom right to LF
  - Do this for frontend/scripts/run-dev.sh and backend/scripts/run-dev.sh 
3) Database migration issues
  - If the backend complains about compiler issues while the database migration is occuring go into backend/scripts/run-dev.sh
  - Check to make sure in line 25, the stamp command is pointing to the right migration for the database,
      - Ask for help on this one, it may require a bit of manual work to get fixed

## Getting Started

At this point, the docker should have gotten everything set up. After going to [http://localhost:3000/](http://localhost:3000/) you should be able to log into the docker

To access the site, sign in with the username of **admin** and password of **password**. After logging in navigate to the admin-portal to create your first project (make sure to make a label group and some labels for the project!). 

***Note*** Skip next step is you are able to upload via the admin portal upload button
After creating a project, get the api key by returning to the admin portal. You can use the api key to add data to a project. Create a new terminal (while docker is running the severs) and cd into audino/backend/scripts. Here use the fallowing command:

```
python upload_mass.py --username admin.test --is_marked_for_review True --audio_file C:\REPLACE\THIS\WITH\FOLDER\PATH\TO\AUDIO\DATA --host localhost --port 5000 --api_key REPLACE_THIS_WITH_API_KEY
```
Make sure to have a folder with the audio data ready to be added. For testing purposes, get a folder with about 20 clips. 

Once that runs you are ready to start testing!


### For Production

You can either run the project on [default configuration](./docker-compose.prod.yml) or modify them to your need.
**Note**: Before proceeding further, you might need to give docker `sudo` access or run the commands listed below as `sudo`.

Ask Team Leads for necessary config files to run this and help setting up production sever on a local machine. 
Production will not work on windows. 

**To build the services, run:**

```sh
$ docker-compose -f docker-compose.prod.yml build
```

or alternatively you can also run this to rebuild everything fully

```sh 
$ docker-compose -f docker-compose.prod.yml up --build --remove-orphans --force-recreate
```
**To bring up the services, run:**

```sh
$ docker-compose -f docker-compose.prod.yml up
```

Then, in browser, go to [http://0.0.0.0/](http://0.0.0.0/) to view the application.

**To bring down the services, run:**

```sh
$ docker-compose -f docker-compose.prod.yml down
```

