console.log("Starting OPC UA server web frontend. Call it using http://<IP-ADDRESS:8080>");

const listenport = 8080;

const kill  = require('tree-kill');
const http = require('http');
const formidable = require('formidable');
const fs = require('fs');
const spawn = require("child_process").spawn;

// locals 
var cOutput = './myNS';
var xmlInput = cOutput +'.xml';
var Server = null;
var cCompiler = null;
var xmlCompiler = null;

// create the http server 
http.createServer(function (req, res) {

  // check the URL been requested and switch

  if (req.url == '/generate') {

    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {

      // rename the temporary filename to static file name myNS
      fs.rename(files.filetoupload.path, xmlInput, function (err) {
        if (err) throw err;

        var result = '';

        // if there is a child process already running kill it
        if(xmlCompiler !== null) {
          kill(xmlCompiler.pid);
          xmlCompiler = null;
        }

        // call the nodeset compiler python script
        xmlCompiler = spawn('python',["/open62541/tools/nodeset_compiler/nodeset_compiler.py",
                            "--types-array=UA_TYPES",
                            "--existing",
                            "/open62541/deps/ua-nodeset/Schema/Opc.Ua.NodeSet2.xml",
                            "--xml",
                            xmlInput,
                            cOutput ] );
        // collect all outputs coming from the python script
        xmlCompiler.stdout.on('data', function(data) {
          result += '<p>'+data.toString()+'</p>';
        } );

        // collect all errors coming from the python script
        xmlCompiler.stderr.on('data', function(data) {
           result += '<p>'+data.toString()+'</p>';
        });

        // if the python script ends, output http response
	xmlCompiler.on('close', function (code) {
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.write('<html>');
            res.write('<head>');
              res.write('<h3>Nodeset compiler logging output:</h3>');
            res.write('</head>');
            res.write('<body>');
              res.write(result);
              res.write('<hr>');
              res.write('<h3>STEP 2: Compile executable OPC UA server</h3>'); 
              res.write('<form action="compile" method="post" enctype="multipart/form-data">');
              res.write('<input type="submit" value="Compile">(may take a while, please be patient)');
              res.write('</form>');
            res.write('</body>');
          res.write('</html>');

          res.end();
          xmlCompiler = null;
          return;
        });
      });
    });
  } else if (req.url == '/run') {

    var result = '';

    // if there is a child process already running kill it
    if(Server !== null) {
      kill(Server.pid);
      Server = null;
    }

    Server = spawn('./server');

    // collect all outputs coming from the c compiler
    Server.stdout.on('data', function(data) {
      result += '<p>'+data.toString()+'</p>';
    } );

    // collect all errors coming from the c compiler
    Server.stderr.on('data', function(data) {
      result += '<p>'+data.toString()+'</p>';
    });

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<html>');
      res.write('<body>');
        res.write('<hr>');
        res.write('<h3>Return to main page to upload a new XML file and to recompile and rerun the server.</h3>'); 
        res.write('<form action="/" method="post" enctype="multipart/form-data">');
        res.write('<input type="submit" value="Return">');
        res.write('</form>');
      res.write('</body>');
    res.write('</html>');

    res.end();

  } else if (req.url == '/compile') {

    var result = '';

    // if there is a child process already running kill it
    if(cCompiler !== null) {
      kill(cCompiler.pid);
      cCompiler = null;
    }

    // call the c compiler to compile the executable server
    cCompiler = spawn('gcc',["-std=c99",
                      "-DUA_ARCHITECTURE_POSIX",
                      "-I/open62541/build/",
                      "-I/open62541/include/",
                      "-I/open62541/build/src_generated/",
                      "-I/open62541/arch/",
                      "-I/open62541/plugins/include/",
                      "./server.c", 
                      cOutput+".c",
                      "/open62541/build/bin/libopen62541.a",
                      "-oserver" ] );

    // collect all outputs coming from the c compiler
    cCompiler.stdout.on('data', function(data) {
      result += '<p>'+data.toString()+'</p>';
    } );

    // collect all errors coming from the c compiler
    cCompiler.stderr.on('data', function(data) {
      result += '<p>'+data.toString()+'</p>';
    });

    // if the c compiler is finished, output http response
    cCompiler.on('close', function (code) {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write('<html>');
        res.write('<head>');
        res.write('<h3>C Compiler logging output:</h3>');
        res.write('</head>');
        res.write('<body>');
          if (result == '') result = '<p>No errors</p>';
          res.write(result);
          res.write('<hr>');
          res.write('<h3>STEP 3: Run server</h3>'); 
          res.write('<form action="run" method="post" enctype="multipart/form-data">');
          res.write('<input type="submit" value="Run">');
          res.write('</form>');
        res.write('</body>');
      res.write('</html>');
      res.end();
      cCompiler = null;
    });
  } else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<html>');
      res.write('<hr>');
      res.write('<head>');
      res.write('<h3>STEP 1: Compile C-CODE from OPC UA nodeset XML file using <a href="https://open62541.org/doc/current/nodeset_compiler.html" target="_blank">XML Nodeset Compiler</a></h3>'); 
      res.write('</head>');
      res.write('<body>');
        res.write('<form action="generate" method="post" enctype="multipart/form-data">');
          res.write('<input type="file" accept=".xml" name="filetoupload"><br><br>');
          res.write('<input type="submit" value="Compile">(may take a while, please be patient)');
        res.write('</form>');
      res.write('</body>');
    res.write('</html>');

    return res.end();
  }
}).listen(listenport);
