## OPC UA Server

[![](https://images.microbadger.com/badges/image/hilschernetpi/netpi-raspbian.svg)](https://microbadger.com/images/hilschernetpi/netpi-opcua-server "OPC UA Server")
[![](https://images.microbadger.com/badges/commit/hilschernetpi/netpi-raspbian.svg)](https://microbadger.com/images/hilschernetpi//netpi-opcua-server "OPC US Server")
[![Docker Registry](https://img.shields.io/docker/pulls/hilschernetpi/netpi-raspbian.svg)](https://registry.hub.docker.com/u/hilschernetpi/netpi-opcua-server/)&nbsp;
[![Image last updated](https://img.shields.io/badge/dynamic/json.svg?url=https://api.microbadger.com/v1/images/hilschernetpi/netpi-opcua-server&label=Image%20last%20updated&query=$.LastUpdated&colorB=007ec6)](http://microbadger.com/images/hilschernetpi/netpi-opcua-server "Image last updated")&nbsp;

Made for [netPI](https://www.netiot.com/netpi/), the Raspberry Pi 3B Architecture based industrial suited Open Edge Connectivity Ecosystem

### OPC UA Server with compilable/changeable static nodeset

The image provided hereunder deploys a container with installed Debian, node.js, Python, an OPC UA Library, an OPC UA XML Nodeset Compiler and a simple node.js based web application for compiling and running your personal OPC UA server instance based on a XML nodeset schema you handed over to it online. 

Base of this image builds [debian](https://www.balena.io/docs/reference/base-images/base-images/) with enabled [SSH](https://en.wikipedia.org/wiki/Secure_Shell), preinstalled [node.js](https://nodejs.org/en/), [Python](https://www.python.org/), created user 'root' and installed [Open62541](https://open62541.org/) based precompiled OPC UA library allowing to run OPC UA server or client funtions natively. (The container uses the server functions only). The Python script based [Nodeset Compiler](https://open62541.org/doc/current/nodeset_compiler.html) allows the transformation of an OPC UA specification compliant XML nodeset schema to C code. The C coded output together with the [Base UANodeSet XML](https://github.com/Pro/UA-Nodeset/blob/59e75b2918b0edc16c8d057874afa7fbb8f0070f/Schema/Opc.Ua.NodeSet2.xml) builds the basis for the compilation of an executable OPC UA server program.   

The web application frontend is node.js based and executed by the `upload.js` file in the folder `/open62541/html/`.

The very simple sample OPC UA server source code `server.c` that is compiled with the C coded and your transformed XML scheme file to the final executeable OPA UA server is located in the fole `/open62541/html/`.

It needs to be mentioned here that the OPC UA server used in this reference implementation contains no security or certificate handling. For supporting these features the OPC UA library needs to be recompiled with the corresponding [build option](https://open62541.org/doc/current/building.html) and a certificate needs to be generated with e.g. [OpenSSL](https://www.openssl.org/) commands that can be imported to a OPC UA client.

#### Container prerequisites

##### Port mapping

For remote login to the container across SSH the container's SSH port `22` needs to be mapped to any free netPI Host port.

To access the web application over a standard web browser the container's port `8080` needs to be mapped to any free netPI Host port.

To access the OPA UA server over any OPC UA client the container's port `4840` needs to be mapped to netPI's Host port `4840`.

#### Getting started

STEP 1. Open netPI's website in your browser (https).

STEP 2. Click the Docker tile to open the [Portainer.io](http://portainer.io/) Docker management user interface.

STEP 3. Enter the following parameters under *Containers > + Add Container*

Parameter | Value | Remark
:---------|:------ |:------
*Image* | **hilschernetpi/netpi-opcua-server**
*Port mapping* | *host* **22** -> *container* **22** | *host*=any unused
*Port mapping* | *host* **8080** -> *container* **8080** | *host*=any unused
*Port mapping* | *host* **4840** -> *container* **4840** | 
*Restart policy* | **always**

STEP 4. Press the button *Actions > Start/Deploy container*

Pulling the image may take a while (5-10mins). Sometimes it may take too long and a time out is indicated. In this case repeat STEP 4.

#### Accessing

The container starts the SSH server automatically.

If necessary login to it with an SSH client such as [putty](http://www.putty.org/) using netPI's IP address at port `22`. Use the credentials `root` as user and `root` as password when asked and you are logged in as root.

To access the container's web frontend application use netPI's ip address together with your mapped port (default 8080) in your browser e.g. http://<netPI's ip address:8080>.

Building the server and running it is a 3 step procedure.

STEP 1: Select your XML scheme file you want to upload and get compiled via the Nodeset_Compiler. Click `Compile` after having selected the file. Compiling may take a while and depends mainly on the number of objects found in your XML file.

(There are nodeset modeler softwares available free of charge on the web to generate and export an OPC UA XML nodeset files: [Siemens](https://support.industry.siemens.com/cs/document/109755133/siemens-opc-ua-modeling-editor-(siome)-for-implementing-opc-ua-companion-specifications?dti=0&lc=en-BH), [Unified Automation](https://www.unified-automation.com/downloads/opc-ua-development.html)).  

STEP 2: Compile the final executeable OPC UA server. Click `Compile` to compile and combine your personal nodeset with the OPA UA base nodeset scheme to a whole.

STEP 3: Press `Run` to start the OPC UA server. The server is getting immediately accessible for any OPC UA client over the URL `opc.tcp://<netPI's IP address:4840>`.

#### Example XML

The container's GitHub source code repository includes a sample XML file in the folder /example/example.xml in case you have not a valid XML file at hand yourself. Use it for a simple test.

The file configures a single boolean variable named `MynetPiVariable` that you set to `true` or `false` with your OPC UA Client.

#### Automated build

The project complies with the scripting based [Dockerfile](https://docs.docker.com/engine/reference/builder/) method to build the image output file. Using this method is a precondition for an [automated](https://docs.docker.com/docker-hub/builds/) web based build process on DockerHub platform.

DockerHub web platform is x86 CPU based, but an ARM CPU coded output file is needed for Raspberry systems. This is why the Dockerfile includes the [balena.io](https://balena.io/blog/building-arm-containers-on-any-x86-machine-even-dockerhub/) steps.

#### License

View the license information for the software in the project. As with all Docker images, these likely also contain other software which may be under other licenses (such as Bash, etc from the base distribution, along with any direct or indirect dependencies of the primary software being contained).
As for any pre-built image usage, it is the image user's responsibility to ensure that any use of this image complies with any relevant licenses for all software contained within.

[![N|Solid](http://www.hilscher.com/fileadmin/templates/doctima_2013/resources/Images/logo_hilscher.png)](http://www.hilscher.com)  Hilscher Gesellschaft fuer Systemautomation mbH  www.hilscher.com
