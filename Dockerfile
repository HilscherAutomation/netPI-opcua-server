#STEP 1 of multistage build ---Compile opc ua library ---

#use armv7hf compatible base image
FROM balenalib/armv7hf-debian:stretch as builder

#enable building ARM container on x86 machinery on the web (comment out next line if built on Raspberry)
RUN [ "cross-build-start" ]

#install tools for building the open64541 library
RUN apt-get update \
    && apt-get install git build-essential gcc pkg-config cmake python \
    && apt-get install cmake-curses-gui \
    && apt-get install libmbedtls-dev \
    && apt-get install check \
    && apt-get install python-sphinx graphviz \
    && apt-get install python-sphinx-rtd-theme

#compile the SSL library 
RUN git clone https://github.com/ARMmbed/mbedtls --branch mbedtls-2.16.1 \
    && cd mbedtls \
    && mkdir build \
    && cd build \
    && cmake .. \
    && make

#install open62541 stack
RUN git clone --recursive https://github.com/open62541/open62541 \
    && cd open62541 \
    && git checkout -b 14may2019 ffb69bf3a14c742a9b376d5ec479802d75ae6ce8 \
    && mkdir build \
    && mkdir build_encr \
    && cd build_encr \
    && cmake .. -DUA_NAMESPACE_ZERO=FULL -DCMAKE_BUILD_TYPE=Release -DUA_ENABLE_ENCRYPTION=ON -DMBEDTLS_INCLUDE_DIRS=/mbedtls/build/include \
       -DMBEDTLS_LIBRARY=/mbedtls/build/library -DMBEDX509_LIBRARY=/mbedtls/build/library -DMBEDCRYPTO_LIBRARY=/mbedtls/build/library \
    && make \
    && cd ../build \
    && cmake .. -DUA_NAMESPACE_ZERO=FULL -DCMAKE_BUILD_TYPE=Release \
    && make

#stop processing ARM emulation (comment out next line if built on Raspberry)
RUN [ "cross-build-end" ]

#STEP 2 of multistage build ----Create the final image-----

#use armv7hf compatible base image
FROM balenalib/armv7hf-debian:stretch

#dynamic build arguments coming from the /hook/build file
ARG BUILD_DATE
ARG VCS_REF

#metadata labels
LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.vcs-url="https://github.com/HilscherAutomation/netPI-opcua-server" \
      org.label-schema.vcs-ref=$VCS_REF

#enable building ARM container on x86 machinery on the web (comment out next line if built on Raspberry)
RUN [ "cross-build-start" ]

#version
ENV HILSCHERNETPI_OPCUA_SERVER_VERSION 1.1.0

#labeling
LABEL maintainer="netpi@hilscher.com" \
      version=$HILSCHERNETPI_OPCUA_SERVER_VERSION \
      description="OPC UA Server"

RUN apt-get update \
    && apt-get install -y openssh-server build-essential curl python python-pip python-dev \
    && echo 'root:root' | chpasswd \
    && sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config \
    && sed 's@session\s*required\s*pam_loginuid.so@session optional pam_loginuid.so@g' -i /etc/pam.d/sshd \
    && mkdir /var/run/sshd 

#install python tools
RUN pip install --upgrade setuptools \
    && pip install --upgrade wheel \
    && pip install --upgrade netifaces

# create all necessary folders
RUN mkdir -p ./open62541/html/certs_copy \
    && mkdir -p ./mbedtls/build/library \
    && mkdir -p ./mbedtls/build/include/mbedtls \
    && mkdir -p ./open62541/deps/ua-nodeset/Schema/ \
    && mkdir -p ./open62541/tools/nodeset_compiler/ \
    && mkdir -p ./open62541/tools/certs/ \
    && mkdir -p ./open62541/include/open62541/ \
    && mkdir -p ./open62541/plugins/include/ \
    && mkdir -p ./open62541/arch/ \
    && mkdir -p ./open62541/build/bin \
    && mkdir -p ./open62541/build_encr/bin \
    && mkdir -p ./open62541/build/src_generated/ \
    && mkdir -p ./open62541/build_encr/src_generated/ \
    && mkdir -p ./open62541/examples/ 

#install node.js and npm modules
RUN curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -  \
    && apt-get install -y nodejs \
    && cd ./open62541/html \
    && npm install formidable \
    && npm install tree-kill \
    && npm install find-process \
    && npm install url \
    && rm -rf /tmp/* \
    && rm -rf /var/lib/apt/lists/*

#copy the html application
COPY "./html/*.*" ./open62541/html/

#copy include files and library from STEP 1 build
COPY --from=builder /open62541/deps /open62541/deps/
COPY --from=builder /open62541/deps/ua-nodeset /open62541/deps/ua-nodeset/
COPY --from=builder /open62541/deps/ua-nodeset/Schema /open62541/deps/ua-nodeset/Schema/
COPY --from=builder /open62541/deps /open62541/deps/
COPY --from=builder /open62541/plugins /open62541/plugins/
COPY --from=builder /open62541/plugins/include /open62541/plugins/include/
COPY --from=builder /open62541/include/open62541 /open62541/include/open62541/
COPY --from=builder /open62541/arch /open62541/arch/
COPY --from=builder /open62541/build/bin /open62541/build/bin/
COPY --from=builder /open62541/build_encr/bin /open62541/build_encr/bin/
COPY --from=builder /open62541/build/src_generated /open62541/build/src_generated/
COPY --from=builder /open62541/build_encr/src_generated /open62541/build_encr/src_generated/
COPY --from=builder /open62541/tools/nodeset_compiler /open62541/tools/nodeset_compiler/
COPY --from=builder /open62541/tools/certs /open62541/tools/certs/
COPY --from=builder /open62541/examples/common.h /open62541/examples/common.h
COPY --from=builder /mbedtls/build/library /mbedtls/build/library/
COPY --from=builder /mbedtls/build/include/mbedtls /mbedtls/build/include/mbedtls/

#set workdir
WORKDIR /open62541/html/

#copy entrypoint file
COPY "./init.d/*" /etc/init.d/

#set the entrypoint
ENTRYPOINT ["/etc/init.d/entrypoint.sh"]

#Ports
EXPOSE 22 4840 8080

#set STOPSGINAL
STOPSIGNAL SIGTERM

#stop processing ARM emulation (comment out next line if built on Raspberry)
RUN [ "cross-build-end" ]
