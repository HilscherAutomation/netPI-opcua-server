## OPC UA Server (open62541)

[![](https://images.microbadger.com/badges/image/hilschernetpi/netpi-opcua-server.svg)](https://microbadger.com/images/hilschernetpi/netpi-opcua-server "OPC UA Server")
[![](https://images.microbadger.com/badges/commit/hilschernetpi/netpi-opcua-server.svg)](https://microbadger.com/images/hilschernetpi//netpi-opcua-server "OPC UA Server")
[![Docker Registry](https://img.shields.io/docker/pulls/hilschernetpi/netpi-opcua-server.svg)](https://registry.hub.docker.com/r/hilschernetpi/netpi-opcua-server/)&nbsp;
[![Image last updated](https://img.shields.io/badge/dynamic/json.svg?url=https://api.microbadger.com/v1/images/hilschernetpi/netpi-opcua-server&label=Image%20last%20updated&query=$.LastUpdated&colorB=007ec6)](http://microbadger.com/images/hilschernetpi/netpi-opcua-server "Image last updated")&nbsp;

Made for [netPI](https://www.netiot.com/netpi/), the Raspberry Pi 3B Architecture based industrial suited Open Edge Connectivity Ecosystem

### OPC UA Server with compilable/changeable static nodeset

The image provided hereunder deploys a container with installed Debian, node.js, Python, OPC UA Libraries (with/without encrypted messaging), an OPC UA XML Nodeset Compiler and a node.js based Web GUI that enables compiling and deploying an OPC UA server instance based on a XML nodeset schema file uploaded to it online.

Base of this image builds [debian](https://www.balena.io/docs/reference/base-images/base-images/) with enabled [SSH](https://en.wikipedia.org/wiki/Secure_Shell), preinstalled [node.js](https://nodejs.org/en/), [Python](https://www.python.org/), created user 'root' and installed [Open62541](https://open62541.org/) based precompiled OPC UA libraries. The additional installed Python script based [XML Nodeset Compiler](https://open62541.org/doc/current/nodeset_compiler.html) transforms in a first step an uploaded OPC UA specification compliant XML nodeset schema to C code. In a second step this C coded nodeset output is compiled and linked online against a basic server source code to the final OPC UA server executable. The Web GUI creating `upload.js` is node.js based and located in the folder `/open62541/html/`. In the same folder find the codebase `server.c` and `server_encryption.c`.

For encrypted communication a server certificate and a private key are created at first start.

#### Container prerequisites

##### Volume mapping 

To store the certificate and key safely a method is chosen to outsource them on a "separate" volume outside the container. The advantage: even if the container is removed the files remain on the system in this volume and if remapped are available in a new container instance again.

##### Port mapping

For optional remote login to the container across SSH the container's SSH port `22` may be mapped to any free netPI Host port.

To access the web application over a standard web browser the container's port `8080` needs to be mapped to any free netPI Host port.

To access the OPC UA server over any OPC UA client the container's port `4840` needs to be mapped to any free netPI's Host port.

#### Getting started

STEP 1. Open netPI's website in your browser (https).

STEP 2. Click the Docker tile to open the [Portainer.io](http://portainer.io/) Docker management user interface.

STEP 3. Click *Volumes > + Add Volume*, name it **certs**, keep *Driver -> local* and click *Create the Volume* (one-time)

STEP 4. Enter the following parameters under *Containers > + Add Container*

Parameter | Value | Remark
:---------|:------ |:------
*Image* | **hilschernetpi/netpi-opcua-server**
*Port mapping* | *host* **22** -> *container* **22** | optional, *host*=any unused
*Port mapping* | *host* **8080** -> *container* **8080** | *host*=any unused
*Port mapping* | *host* **4840** -> *container* **4840** | *host*=any unused
*Volumes > Volume mapping > map volume* | *container* **/certs** -> *volume* **certs** |
*Restart policy* | **always**

STEP 5. Press the button *Actions > Start/Deploy container*

Pulling the image may take a while (5-10mins). Sometimes it may take too long and a time out is indicated. In this case repeat STEP 5.

#### Accessing SSH (optional)

The container starts the SSH server automatically. Open a terminal connection to it with an SSH client such as [putty](http://www.putty.org/) using netPI's IP address at your mapped port.

Use the credentials `root` as user and `root` as password when asked and you are logged in as root.

#### Accessing Web GUI

To access the Web GUI use netPI's ip address together with your mapped port (default 8080) in your browser e.g. http://<netPI's ip address:8080>.

To run thr OPC UA server follow this procedure:

STEP 1: Select your XML nodeset file you want to upload and get compiled. Click `Compile ...` after having selected the file (may take a while). Watch the error log output on the next page.

(XML nodeset file modelers available free of charge: [Siemens](https://support.industry.siemens.com/cs/document/109755133/siemens-opc-ua-modeling-editor-(siome)-for-implementing-opc-ua-companion-specifications?dti=0&lc=en-BH), [Unified Automation](https://www.unified-automation.com/downloads/opc-ua-development.html), [Free OPC UA modeler](https://github.com/FreeOpcUa/opcua-modeler)).

STEP 2: Compile the OPC UA server. Click either `Compile unsecure ...` or `Compile secure ...` to start compilation. Watch the error log output on the next page.

STEP 3: Press `Run ...` to start the OPC UA server.

A repeated procedure will stop a currently running server while a new one is spawned. A container restart will automatically start the last compiled server.

#### Example XML

The container's GitHub source code repository includes a sample XML file in the folder /XMLsample/example.xml in case you have not a valid XML file at hand yourself. Use it for a simple test.

The file configures a single boolean variable named `MynetPiVariable` that you set to `true` or `false` with your OPC UA Client.

#### Free OPC UA modeler

The [Free OPC UA Modeler](https://github.com/FreeOpcUa/opcua-modeler) is a tool for designing OPC UA Nodeset XML files. It is based on Python language and can run under Windows too.

STEP 1: Load (Win)Python under Windows (tested with version WinPython_3.8) from [here](https://sourceforge.net/projects/winpython/files/) and install it. Remember the installation folder.

STEP 2: With your Windows explorer navigate to the installation folder, locate the executeable `WinPython Powershell Prompt.exe` and start it WITH administrative rights.

STEP 3: In the console enter `python -m pip install --upgrade pip` to install the python package management command `pip` in the latest version.

STEP 4: Install the Free OPC UA modeler using the command `pip install opcua-modeler` in the same console.

STEP 5: With the command `cd`(change dir) navigate to the installed Python executeable OPC UA modeler in the folder `Script` e.g. `C:\Program Files\WPy64-3720\python-3.7.2.amd64\Scripts`.

STEP 6. Start the OPC UA modeler entering the command `./opcua-modeler.exe` in your console.

STEP 7. In the opening application use the top menu bar and click `Actions\New Model` to prepare it for a new setup.

STEP 8. Give your OPC UA server's namespace table a resonable name. Right click `NamespaceArray` in the middle left window and choose `Add Namespace`. In row `Value` line `1` enter a name e.g "myserver".

STEP 9. Right click `Displayname\Root\Objects` in the window underneath and choose `Add Variable` to add a  single variable to your nodeset.

STEP 10. Change the variable's name from `NoName` to any value of your choice e.g. `myvar`, uncheck `Auto NodeId` checkbox, enter an object index behind `ns=0;i=` such as `1000` and finally click rightmost to specify the datatype e.g. `DisplayName\BaseDataType\Boolean` and finally confirm with `ok`.

STEP 11. Add other variables in the same manner and then click `Actions\Save` to export the XML file.

STEP 12. Import the XML file into the containered OPC UA server's web application and compile your OPC UA server

#### Automated build

The project complies with the scripting based [Dockerfile](https://docs.docker.com/engine/reference/builder/) method to build the image output file. Using this method is a precondition for an [automated](https://docs.docker.com/docker-hub/builds/) web based build process on DockerHub platform.

DockerHub web platform is x86 CPU based, but an ARM CPU coded output file is needed for Raspberry systems. This is why the Dockerfile includes the [balena.io](https://balena.io/blog/building-arm-containers-on-any-x86-machine-even-dockerhub/) steps.

#### License

View the license information for the software in the project. As with all Docker images, these likely also contain other software which may be under other licenses (such as Bash, etc from the base distribution, along with any direct or indirect dependencies of the primary software being contained).
As for any pre-built image usage, it is the image user's responsibility to ensure that any use of this image complies with any relevant licenses for all software contained within.

#### Open62541 License 

The Open source implementation of OPC UA (OPC Unified Architecture) aka IEC 62541 is licensed under Mozilla Public License v2.0, see http://open62541.org

[![N|Solid](http://www.hilscher.com/fileadmin/templates/doctima_2013/resources/Images/logo_hilscher.png)](http://www.hilscher.com)  Hilscher Gesellschaft fuer Systemautomation mbH  www.hilscher.com
