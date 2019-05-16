## OPC UA Server (open62541)

[![](https://images.microbadger.com/badges/image/hilschernetpi/netpi-raspbian.svg)](https://microbadger.com/images/hilschernetpi/netpi-opcua-server "OPC UA Server")
[![](https://images.microbadger.com/badges/commit/hilschernetpi/netpi-raspbian.svg)](https://microbadger.com/images/hilschernetpi//netpi-opcua-server "OPC UA Server")
[![Docker Registry](https://img.shields.io/docker/pulls/hilschernetpi/netpi-opcua-server.svg)](https://registry.hub.docker.com/u/hilschernetpi/netpi-opcua-server/)&nbsp;
[![Image last updated](https://img.shields.io/badge/dynamic/json.svg?url=https://api.microbadger.com/v1/images/hilschernetpi/netpi-opcua-server&label=Image%20last%20updated&query=$.LastUpdated&colorB=007ec6)](http://microbadger.com/images/hilschernetpi/netpi-opcua-server "Image last updated")&nbsp;

Made for [netPI](https://www.netiot.com/netpi/), the Raspberry Pi 3B Architecture based industrial suited Open Edge Connectivity Ecosystem

### OPC UA Server with compilable/changeable static nodeset

The image provided hereunder deploys a container with installed Debian, node.js, Python, OPC UA Libraries (with/without encryption), the OPC UA XML Nodeset Compiler and a node.js based web GUI for compiling and deploying an OPC UA server instance based on a XML nodeset schema file uploaded online.

Base of this image builds [debian](https://www.balena.io/docs/reference/base-images/base-images/) with enabled [SSH](https://en.wikipedia.org/wiki/Secure_Shell), preinstalled [node.js](https://nodejs.org/en/), [Python](https://www.python.org/), created user 'root' and installed [Open62541](https://open62541.org/) based precompiled OPC UA libraries allowing to run OPC UA server or client funtions natively. (The container is using the server functions only). The Python script based [Nodeset Compiler](https://open62541.org/doc/current/nodeset_compiler.html) allows the transformation of an OPC UA specification compliant XML nodeset schema to C code. The C coded nodeset output builds the basis for compiling the OPC UA server executable.

The web GUI `upload.js` is node.js based and located in the folder `/open62541/html/`. In the same folder the source codes `server.c` and `server_encryption.c` are compiled online with the uploaded and transformed XML nodeset file to the final executeable OPC UA server.

A server certificate and key are created during the container's first start. They are needed for secure TLS based OPC UA communication in case a secured OPC UA server is used. To store the files safely a additional volume needs to be mounted.

#### Container prerequisites

##### Volume mapping 

To store the generated key and certificate a method is chosen to outsource them on a separate volume outside the container. The advantage: even if the container is removed the files remain on the sytem and could be reused if a new container instance is started. 

##### Port mapping

For remote login to the container across SSH the container's SSH port `22` may be mapped to any free netPI Host port.

To access the web application over a standard web browser the container's port `8080` needs to be mapped to any free netPI Host port.

To access the OPC UA server over any OPC UA client the container's port `4840` needs to be mapped to any free netPI's Host port.

#### Getting started

STEP 1. Open netPI's website in your browser (https).

STEP 2. Click the Docker tile to open the [Portainer.io](http://portainer.io/) Docker management user interface.

STEP 3. Click *Volumes > + Add Volume*, name it *certs*, keep *Driver -> local* and click *Create the Volume* (one-time)

STEP 4. Enter the following parameters under *Containers > + Add Container*

Parameter | Value | Remark
:---------|:------ |:------
*Image* | **hilschernetpi/netpi-opcua-server**
*Runtime > Port mapping* | *host* **22** -> *container* **22** | optional, *host*=any unused
*Runtime > Port mapping* | *host* **8080** -> *container* **8080** | *host*=any unused
*Runtime > Port mapping* | *host* **4840** -> *container* **4840** | *host*=any unused
*Volumes > Volume mapping > map volume* | *container* **/certs** -> *volume* > **certs** |
*Restart policy* | **always**

STEP 5. Press the button *Actions > Start/Deploy container*

Pulling the image may take a while (5-10mins). Sometimes it may take too long and a time out is indicated. In this case repeat STEP 5.

#### Accessing SSH (optional)

The container starts the SSH server automatically. Open a terminal connection to it with an SSH client such as [putty](http://www.putty.org/) using netPI's IP address at your mapped port.

Use the credentials `root` as user and `root` as password when asked and you are logged in as root.

#### Accessing web GUI

To access the container's web GUI use netPI's ip address together with your mapped port (default 8080) in your browser e.g. http://<netPI's ip address:8080>.

Running and deploying the OPC UA server is a 3 step procedure:

STEP 1: Select your XML nodeset file you want to upload and get compiled via the Nodeset_Compiler. Click `Compile` after having selected the file. Compiling may take a while and depends mainly on the number of objects found in your XML file.

(There are nodeset modeler softwares available free of charge on the web to generate and export an OPC UA XML nodeset files: [Siemens](https://support.industry.siemens.com/cs/document/109755133/siemens-opc-ua-modeling-editor-(siome)-for-implementing-opc-ua-companion-specifications?dti=0&lc=en-BH), [Unified Automation](https://www.unified-automation.com/downloads/opc-ua-development.html), [Free OPC UA modeler](https://github.com/FreeOpcUa/opcua-modeler)).  

STEP 2: Compile the OPC UA server. Click `Compile unsecure` or `Compile secure` to compile it and to combine your nodeset to a final executeable.

STEP 3: Press `Run` to start the OPC UA server (unsecured/secured). The server is getting immediately accessible for any OPC UA client.

If you repeat the procedure a currently running server is stopped and a new one spawned. If the container is restarted it checks for a previously compiled OPC UA server and starts it automatically.

#### Example XML

The container's GitHub source code repository includes a sample XML file in the folder /example/example.xml in case you have not a valid XML file at hand yourself. Use it for a simple test.

The file configures a single boolean variable named `MynetPiVariable` that you set to `true` or `false` with your OPC UA Client.

#### Free OPC UA modeler to generate XML file

The [Free OPC UA Modeler](https://github.com/FreeOpcUa/opcua-modeler) is a tool for designing OPC UA Nodeset XML files. It is based on Python language and can run under Windows too.

STEP 1: Install (Win)Python under Windows (tested with version WinPython_3.8) from [here](https://sourceforge.net/projects/winpython/files/). Remember the installation folder.

STEP 2: Navigate with your Windows explorer to the installation folder, locate the executeable `WinPython Powershell Prompt.exe` and start it WITH!!! administrative rights.

STEP 3: In the console enter `python -m pip install --upgrade pip` to install the python package management command `pip` in the latest version.

STEP 4: Install the Free OPC UA modeler using the command `pip install opcua-modeler` in the same console.

STEP 5: Navigate with the change dir command `cd` to the installed executeable OPC UA modeler in the folder `Script` e.g. `C:\Program Files\WPy64-3720\python-3.7.2.amd64\Scripts`.

STEP 6. Start the OPC UA modeler with the command `./opcua-modeler.exe`.

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

[![N|Solid](http://www.hilscher.com/fileadmin/templates/doctima_2013/resources/Images/logo_hilscher.png)](http://www.hilscher.com)  Hilscher Gesellschaft fuer Systemautomation mbH  www.hilscher.com
