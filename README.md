## OPC UA Server (open62541)

Made for Raspberry Pi 3B architecture based devices and compatibles

### Docker repository

https://hub.docker.com/r/hilschernetpi/netpi-opcua-server

### Container features

The image provided hereunder deploys a container with installed Debian, node.js, Python, OPC UA Libraries (with/without encrypted messaging), an OPC UA XML Nodeset Compiler and a node.js web based GUI that enables compiling and deploying an OPC UA server instance based on a XML nodeset schema file uploaded to it online.

Base of this image builds [debian](https://www.balena.io/docs/reference/base-images/base-images/) with preinstalled [node.js](https://nodejs.org/en/), [Python](https://www.python.org/) and installed [Open62541](https://open62541.org/) based precompiled OPC UA libraries. The additional installed Python script based [XML Nodeset Compiler](https://open62541.org/doc/current/nodeset_compiler.html) transforms in a first step an uploaded OPC UA specification compliant XML nodeset schema to C code. In a second step this C coded nodeset output is compiled and linked online against a basic server source code to the final OPC UA server executable. 

### Container hosts

The container has been successfully tested on the following hosts

* netPI, model RTE 3, product name NIOT-E-NPI3-51-EN-RE
* netPI, model CORE 3, product name NIOT-E-NPI3-EN
* netFIELD Connect, product name NIOT-E-TPI51-EN-RE/NFLD
* Raspberry Pi, model 3B

netPI devices specifically feature a restricted Docker protecting the system software's integrity by maximum. The restrictions are

* privileged mode is not automatically adding all host devices `/dev/` to a container
* volume bind mounts to rootfs is not supported
* the devices `/dev`,`/dev/mem`,`/dev/sd*`,`/dev/dm*`,`/dev/mapper`,`/dev/mmcblk*` cannot be added to a container

### Container setup

#### Volume mapping 

To store the server certificate and keys permanently on the Docker host they are outsourced in a "separate" volume outside the container. This keeps the files on the system even if the container is removed. If later the volume is remapped to a new container the files are available again to it and reused.

#### Port mapping

To access the web based GUI over a standard web browser the container's port `8080` needs to be mapped to any free Docker host port. 

To access the OPC UA server with an OPC UA client the container's port `4840` needs to be mapped to any free Docker host port. When the server is running the OPC UA server's endpoint url is `opc.tcp://<Docker host ip address>:<mapped Docker host port>`. 

### Container deployments

Pulling the image may take 10 minutes.

#### netPI example

STEP 1. Open netPI's web UI in your browser (https).

STEP 2. Click the Docker tile to open the [Portainer.io](http://portainer.io/) Docker management user interface.

STEP 3. Click *Volumes > + Add Volume*. Enter `certs` as *Name* and click `Create the volume`. 

STEP 4. Enter the following parameters under *Containers > + Add Container*

Parameter | Value | Remark
:---------|:------ |:------
*Image* | **hilschernetpi/netpi-opcua-server**
*Port mapping* | *host* **8080** -> *container* **8080** | *host*=any unused
*Port mapping* | *host* **4840** -> *container* **4840** | *host*=any unused
*Adv.con.set. > Volumes > +map additional volume* | *container* **/certs** -> *volume* **certs** |
*Adv.con.set. > Restart policy* | **always**

STEP 6. Press the button *Actions > Start/Deploy container*

#### Docker command line example

`docker volume create certs` `&&`
`docker run -d --restart=always -v certs:/certs -p 8080:8080/tcp -p 4840:4840/tcp hilschernetpi/netpi-opcua-server`

#### Docker compose example

A `docker-compose.yml` file could look like this

    version: "2"

    services:
     opcuaserver:
       image: hilschernetpi/netpi-opcua-server
       restart: always
       ports:
         - 8080:8080
         - 4840:4840
       volumes:
         - certs:/certs

### Container access

The container starts the web based GUI automatically when deployed.

To access the GUI use the Docker host's ip address together with your mapped port (default 8080) in your browser address field e.g. `http://192.168.0.1:8080`.

Independent if the OPC UA server is seleted in the GUI to run securely or unsecurely the container will generate a self signed certificate and a public/private key pair if no files found. 

Until the OPC UA server isn't configured once it remains disabled. To configure the OPC UA server follow this procedure:

STEP 1: Select your XML nodeset file you want to upload and get compiled. Click `Compile ...` after having selected the file (may take a while). Watch the error log output on the next page.

(XML nodeset file modelers available free of charge: [Siemens](https://support.industry.siemens.com/cs/document/109755133/siemens-opc-ua-modeling-editor-(siome)-for-implementing-opc-ua-companion-specifications?dti=0&lc=en-BH), [Unified Automation](https://www.unified-automation.com/downloads/opc-ua-development.html), [Free OPC UA modeler](https://github.com/FreeOpcUa/opcua-modeler)).

STEP 2: Compile the OPC UA server online based on your given XML nodeset file. Click either `Compile unsecure ...` or `Compile secure ...` to start compilation. Watch the error log output on the next page.

STEP 3: Before you choose to compile the OPC UA server securely, you have the chance to upload your own trusted certificate and private key replacing the existing ones (usually the self signed ones created at container starting times). Also you have the possibitly to download the current public 

STEP 4: Press `Run ...` to start the OPC UA server.

STEP 5: The server is getting accessible by any OPC UA client using the endpoint url `opc.tcp://<Docker host ip address>:<mapped Docker host port>` e.g. `opc.tcp://192.168.0.1:4840`

A repeated procedure will stop a currently running server while a new one is spawned. A container restart will automatically start the last compiled server.

### Example XML

The container's GitHub source code repository includes a sample XML file in the folder /XMLsample/example.xml in case you have not a valid XML file at hand yourself. Use it for a simple test.

The file configures a single boolean variable named `MynetPiVariable` that you set to `true` or `false` with your OPC UA Client when it is compiled as OPC UA server. 

### Free OPC UA modeler

The [Free OPC UA Modeler](https://github.com/FreeOpcUa/opcua-modeler) is a tool for designing OPC UA Nodeset XML files. It is Python language based and can run on different operating systems. To use it under Windows do:

STEP 1: Load (Win)Python for Windows (tested with version WinPython_3.8) from [here](https://sourceforge.net/projects/winpython/files/) and install it. Remember the installation folder.

STEP 2: With your Windows explorer navigate to the installation folder, locate the executeable `WinPython Powershell Prompt.exe` and start it WITH administrative rights.

STEP 3: In the console enter `python -m pip install --upgrade pip` to install the python package management command `pip` in the latest version.

STEP 4: Install the Free OPC UA modeler using the command `pip install opcua-modeler` in the same console.

STEP 5: With the command `cd`(change dir) navigate in the console to the installed Python executeable OPC UA modeler in the subfolder `python-x.x.x.amd64\Scripts` e.g. `C:\Program Files\WPy64-3830\python-3.8.3.amd64\Scripts`.

STEP 6. Start the OPC UA modeler entering the command `./opcua-modeler.exe` in your console.

STEP 7. In the opening application use the top menu bar and click `Actions\New Model` to prepare it for a new setup. Some modeling settings are set to default state.

STEP 8. Give your OPC UA server's namespace table a resonable name. Right click `NamespaceArray` in the middle left window and choose `Add Namespace`. In row `Value` line `1` enter a name e.g "myserver".

STEP 9. Right click `Displayname\Root\Objects` in the window underneath and choose `Add Variable` to add a single variable to your nodeset.

STEP 10. Change the variable's name from `NoName` to any value of your choice e.g. `myvar`, uncheck `Auto NodeId` checkbox, enter an object index behind `ns=0;i=` such as `1000` and finally click rightmost to specify the datatype e.g. `DisplayName\BaseDataType\Boolean` and finally confirm with `ok`.

STEP 11. Click on your just created variable `myvar` and then move your cursor to the right top window named `Attributes Editor` and locate the attribute `AccessLevel`. Double click its `Value` column and check the box `CurrentWrite` to give your variable also writing access rights. You may also write an initial value to the variable with the attribute `Value`.

STEP 12. Add other variables in the same manner and then finally click `Actions\Save` to export the XML file.

STEP 13. Import the XML file in the OPC UA server's web GUI, click compile and then run. 

### License

The Open source implementation of OPC UA (OPC Unified Architecture) aka IEC 62541 is licensed under Mozilla Public License v2.0, see http://open62541.org

Copyright (c) Hilscher Gesellschaft fuer Systemautomation mbH. All rights reserved.
Licensed under the LISENSE.txt file information stored in the project's source code repository.

As with all Docker images, these likely also contain other software which may be under other licenses (such as Bash, etc from the base distribution, along with any direct or indirect dependencies of the primary software being contained).
As for any pre-built image usage, it is the image user's responsibility to ensure that any use of this image complies with any relevant licenses for all software contained within.

[![N|Solid](http://www.hilscher.com/fileadmin/templates/doctima_2013/resources/Images/logo_hilscher.png)](http://www.hilscher.com)  Hilscher Gesellschaft fuer Systemautomation mbH  www.hilscher.com



