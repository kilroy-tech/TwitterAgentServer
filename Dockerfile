# build with: docker build -t twitteragentserver .
# run with something like:
#   docker run --rm -it --name twitteragentserver -p 3300:3300 --env-file .env -v ./config:/project/config twitteragentserver
# or edit compose.yml and run with docker compose up
FROM node:22

ENV HOME=/home
WORKDIR /project

COPY index.mjs /project/
COPY TwitterAgentRouter.mjs /project/
COPY TwitterAgentScraper.mjs /project/
COPY package.json  /project
COPY public/  /project/public
COPY views/ /project/views/
RUN cd /project \
  && npm install --yes --loglevel verbose \
  && mkdir config
CMD npm start