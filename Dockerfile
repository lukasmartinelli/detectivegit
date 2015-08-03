FROM debian:jessie
MAINTAINER Lukas Martinelli <me@lukasmartinelli.ch>

# install dependencies for building facebook libraries
RUN apt-get update
RUN apt-get install -y \
    python \
    ruby-full make cmake pkg-config \
    openjdk-7-jre \
    git \
    wget unzip \
    nodejs npm

RUN gem install bugspots

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN wget https://github.com/pmd/pmd/releases/download/pmd_releases%2F5.3.3/pmd-bin-5.3.3.zip && \
    unzip pmd-bin-5.3.3.zip && \
    rm pmd-bin-5.3.3.zip
ENV PMD_BINARY /usr/src/app/pmd-bin-5.3.3/bin/run.sh

COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app

EXPOSE 3000
CMD ["nodejs", "server.js"]
