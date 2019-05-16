console.log("Starting OPC UA server web frontend. Call it using http://<netPI's ip address:8080> (or mapped port instead of 8080)");

const listenport = 8080;

const kill  = require('tree-kill');
const http = require('http');
const formidable = require('formidable');
const fs = require('fs');
const spawn = require("child_process").spawn;
const find = require('find-process');


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

        console.log("Compiling OPC UA nodeset XML");

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
              res.write('<h3>STEP 2: Compile OPC UA server</h3>'); 
              res.write('<form action="compile" method="post" enctype="multipart/form-data">');
              res.write('<input type="submit" value="Compile unsecure server ...">');
              res.write('</form>');
              res.write('<form action="compile_encr" method="post" enctype="multipart/form-data">');
              res.write('<input type="submit" value="Compile secure server ...">');
              res.write('</form>');
            res.write('</body>');
          res.write('</html>');

          res.end();
          xmlCompiler = null;
        });
      });
    });
  } else if ( req.url == '/run' ) {

    var result = '';

    // if there is a 'server' already running kill it
    find('name', 'server').then(function (list) {

      if( list.length !== 0 ) {
         if( list[0].pid !== null ) {
            // kill running server 
            kill( list[0].pid );
          }
      }

      // spawn new server (hand over keys even if unsecred is started)
      Server = spawn('./server',["/certs/server_cert.der","/certs/server_key.der"]);

      // collect all outputs coming from the server
      Server.stdout.on('data', function(data) {
        console.log(data.toString());
      } );

      // collect all errors coming from the server 
      Server.stderr.on('data', function(data) {
        console.log(data.toString());
      });

      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write('<html>');
        res.write('<body>');
          res.write('<hr>');
          res.write('<h3>Return to main page.</h3>'); 
          res.write('<form action="/" method="post" enctype="multipart/form-data">');
          res.write('<input type="submit" value="Return">');
          res.write('</form>');
        res.write('</body>');
      res.write('</html>');
      res.end();

    }, function (err) {
        console.log(err.stack || err);
    })

  } else if (req.url == '/compile' || req.url == "/compile_encr" ) {

    var result = '';

    // if there is a child process already running kill it
    if(cCompiler !== null) {
      kill(cCompiler.pid);
      cCompiler = null;
    }

    console.log("Compiling server");

    if( req.url == "/compile" ) {
      // call the c compiler to compile the unsecure server
      cCompiler = spawn('gcc',["-std=c99",
                        "-DUA_ARCHITECTURE_POSIX",
                        "-I/open62541/build/",
                        "-I/open62541/include/",
                        "-I/open62541/build/src_generated/",
                        "-I/open62541/arch/",
                        "-I/open62541/plugins/include/",
                        "-I/open62541/examples/",
                        "./server.c", 
                        cOutput+".c",
                        "/open62541/build/bin/libopen62541.a",
                        "-oserver" ] );
    } else {
      // call the c compiler to compile the secure server
      cCompiler = spawn('gcc',["-std=c99",
                        "-DUA_ARCHITECTURE_POSIX",
                        "-I/open62541/build_encr/",
                        "-I/open62541/include/",
                        "-I/open62541/build_encr/src_generated/",
                        "-I/open62541/arch/",
                        "-I/open62541/plugins/include/",
                        "-I/open62541/examples/",
                        "./server_encryption.c", 
                        cOutput+".c",
                        "/open62541/build_encr/bin/libopen62541.a",
                        "/mbedtls/build/library/libmbedcrypto.a",
                        "/mbedtls/build/library/libmbedtls.a",
                        "/mbedtls/build/library/libmbedx509.a",
                        "-oserver" ] );
    }
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
          res.write('<h3>STEP 3: Run and deploy server</h3>'); 
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
      res.write('<h3>STEP 1: Compile OPC UA nodeset XML </h3>'); 
      res.write('</head>');
      res.write('<body>');
        res.write('<form action="generate" method="post" enctype="multipart/form-data">');
          res.write('<input type="file" accept=".xml" name="filetoupload"><br><br>');
          res.write('<input type="submit" value="Compile ...">');
        res.write('</form>');
      res.write('</body>');
    res.write('</html>');

    return res.end();
  }
}).listen(listenport);
