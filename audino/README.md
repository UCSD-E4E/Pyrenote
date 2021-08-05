<h1 align="center">
  <img src="https://raw.githubusercontent.com/midas-research/audino/add-docs/docs/assets/banner.png?token=ABLJAWWDYM2BYPISPC4DRXS63IB7Y" width="600px" />
</h1>


# audino

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/midas-research/audino/blob/master/LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./docs/getting-started.md#development)

audino is an open source audio annotation tool. It provides features such as transcription and labeling which enables annotation for Voice Activity Detection (VAD), Diarization, Speaker Identification, Automated Speech Recognition, Emotion Recognition tasks and more.


## Features

Current features of the tool include:

1. Multi-language support
2. Collaborative annotation
3. JWT based authentication
4. User-level project, role and data assignment
5. Project-level API Key based datapoint creation
6. Emoji support
7. Flexibility in label creation

<h1 align="center">
  <img src="https://raw.githubusercontent.com/midas-research/audino/master/docs/assets/annotation-dashboard.png" width="500px" />
</h1>

## Usage

*Note: Please see [getting started](docs/getting-started.md) guide for configurations and concrete usage.*

Please install the following dependencies to run `audino` on your system:

1. [git](https://git-scm.com/) *[tested on v2.23.0]*
2. [docker](https://www.docker.com/) *[tested on v19.03.8, build afacb8b]*
3. [docker-compose](https://docs.docker.com/compose/) *[tested on v1.25.5, build 8a1c60f6]*

### Clone the repository

```sh
$ git clone https://github.com/midas-research/audino.git
$ cd audino
```

**Note for Windows users**: Please configure git to handle line endings correctly as services might throw an error and not come up. You can do this by cloning the project this way:

```sh
$ git clone https://github.com/midas-research/audino.git --config core.autocrlf=input
```

### For Production

You can either run the project on [default configuration](./docker-compose.prod.yml) or modify them to your need.
**Note**: Before proceeding further, you might need to give docker `sudo` access or run the commands listed below as `sudo`.

**To build the services, run:**

```sh
$ docker-compose -f docker-compose.prod.yml build
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

### For Development (Note this is the one we will test on and use)

Similar to `production` setup, you need to use development [configuration](./docker-compose.dev.yml) for working on the project, fixing bugs and making contributions.
**Note**: Before proceeding further, you might need to give docker `sudo` access or run the commands listed below as `sudo`.

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
      - Ask for help on this one

## Getting Started

At this point, the docker should have gotten everything set up. After going to [http://localhost:3000/](http://localhost:3000/) you should be able to log into the docker

To access the site, sign in with the username of **admin** and password of **password**. On logging in navigate to the admin-portal to create your frist project (make sure to make a label group and some labels for the project!).

After creating a project, get the api key by returning to the admin portal. You can use the api key to add data to a project. Create a new terminal (while docker is running the severs) and cd into audino/backend/scripts. Here use the fallowing command:

```
python upload_mass.py  --username admin.test  --is_marked_for_review True --audio_file C:\REPLACE\THIS\WITH\FOLDER\PATH\TO\AUDIO\DATA --host localhost 
--port 5000 --api_key REPLACE_THIS_WITH_API_KEY
```
Make sure to have a folder with the audio data ready to be added. For testing purposes, get a folder with about 20 clips. 

Once that runs you are ready to start testing!


## Tutorials

We provide a set of [tutorials](./docs/tutorial.md) to guide users to achieve certain tasks. If you feel something is missing and should be included, please open an [issue](https://github.com/midas-research/audino/issues).

## Citation

Currently, the [paper](https://arxiv.org/abs/2006.05236) is under review. For now, please cite it as:

```
@misc{grover2020audino,
    title={audino: A Modern Annotation Tool for Audio and Speech},
    author={Manraj Singh Grover and Pakhi Bamdev and Yaman Kumar and Mika Hama and Rajiv Ratn Shah},
    year={2020},
    eprint={2006.05236},
    archivePrefix={arXiv},
    primaryClass={cs.SD}
}
```

## License
[MIT](https://github.com/midas-research/audino/blob/master/LICENSE) © MIDAS, IIIT Delhi
