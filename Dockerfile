FROM            ubuntu:12.04
MAINTAINER      James Sharp <james@ortootech.com>

# Build dependencies
RUN        echo 'deb http://archive.ubuntu.com/ubuntu precise main universe' > /etc/apt/sources.list
RUN        apt-get update
RUN        apt-get install -y -q curl && apt-get clean
RUN        apt-get install -y -q build-essential && apt-get clean

# Install node
RUN       NODE_VER=0.10.26 && \
          NODE_FILE=node-v$NODE_VER-linux-x64.tar.gz && \
          curl -o /tmp/$NODE_FILE http://nodejs.org/dist/v$NODE_VER/$NODE_FILE && \
          cd /usr/local && tar --strip-components 1 -xzf /tmp/$NODE_FILE && \
          rm /tmp/$NODE_FILE

# Expose the service port - 3000
EXPOSE    3000

# Set the working directory
WORKDIR   /opt/savethecharlotdate.com

ENTRYPOINT ["node", "server.js"]

# Add the code
ADD       . /opt/savethecharlotdate.com
