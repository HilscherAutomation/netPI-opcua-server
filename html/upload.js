console.log("Starting OPC UA server web frontend. Call http://<Docker host's ip address:port(default 8080)>");

const listenport = 8080;

const kill  = require('tree-kill');
const http = require('http');
const formidable = require('formidable');
const fs = require('fs');
const spawn = require("child_process").spawn;
const find = require('find-process');
const url = require('url');


// locals 
var cOutput = './myNS';
var xmlInput = cOutput +'.xml';
var Server = null;
var cCompiler = null;
var xmlCompiler = null;
var recreate = null;


// create the http server 
http.createServer(function (req, res) {

  // check the URL been requested and switch

  if(req.url.includes('/download')) {

    var query = url.parse(req.url, true).query;

    // read file and send it in the response
    fs.readFile('/open62541/html/certs_copy/' + query.file, function (err, content) {
      if (err) {
        res.writeHead(400, {'Content-type':'text/html'})
        res.end("No such file");
      } else {
        //specify Content will be an attachment
        res.setHeader('Content-disposition', 'attachment; filename='+query.file);
        res.end(content);
      }
    });
  } else if(req.url == '/upload_cert' && req.method.toLowerCase() == 'post') {

    var form = new formidable.IncomingForm();

    form.parse(req)
    .on('file', function (field, file) {

      // copy public certificate from /tmp folder to destination folder
      fs.copyFile(file.path, '/certs/server_cert.der', function(err) {
        fs.copyFile(file.path, '/open62541/html/certs_copy/server_cert.der', function(err) {
          console.log("New certificate sucessfully uploaded");
        });
      });

    })
    .on('end', function() {

       res.end('<html><script>history.back()</script></html>');

    });

 } else if(req.url == '/upload_key' && req.method.toLowerCase() == 'post') {

    var form = new formidable.IncomingForm();

    form.parse(req)
    .on('file', function (field, file) {

      // copy private key from /tmp folder to destination folder
      fs.copyFile(file.path, '/certs/server_key.der', function(err) {
          console.log("New private key sucessfully uploaded");
      });

    })
    .on('end', function() {

       res.end('<html><script>history.back()</script></html>');

    });
  } else if (req.url == '/cert_recreate') {

    // remove existing files
    spawn('rm',["-r","/certs"] );
    spawn('rm',["-r","/open62541/html/certs_copy/server_cert.der"] );

    // call python script to create server certificate and private key
    recreate = spawn('python',["/open62541/tools/certs/create_self-signed.py","/certs"]);

    // when the python script ends, output http response
    recreate.on('close', function (code) {

      spawn('cp',["/certs/server_cert.der","/open62541/html/certs_copy/server_cert.der"] );

      console.log("New Certificate Entity sucessfully created");

      res.write('<html>');
      res.write("<script>window.close();</script>");
      res.write('</html>');
      res.flush();
      res.end();
    });

  } else  if (req.url == '/xml2c') {

    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {

      if(files.filetoupload) {

        // rename the temporary filename to static file name myNS
        fs.rename(files.filetoupload.filepath, xmlInput, function (err) {
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
                res.write('<h3>Compile OPC UA server</h3>'); 
                res.write('<form action="c2opc" method="post" enctype="multipart/form-data">');
                res.write('<input type="submit" value="Compile unsecure server ...">');
                res.write('</form>');
                res.write('<form action="c2opc_encr" method="post" enctype="multipart/form-data">');
                res.write('<input type="submit" value="Compile secure server ...">');
                res.write('</form>');
              res.write('</body>');
            res.write('</html>');

            res.end();
            xmlCompiler = null;
          });
        });
      } else {
        // no file specified
        res.writeHead(200, {'Content-Type': 'text/html'});
          res.write('<html>');
            res.write('<body>');
              res.write('<hr>');
              res.write('<h3>No file specified, return to main page.</h3>'); 
              res.write('<form action="/" method="post" enctype="multipart/form-data">');
                res.write('<input type="submit" value="Return">');
              res.write('</form>');
            res.write('</body>');
          res.write('</html>');
        res.end();
      }
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

      // spawn new server (hand over keys even if unsecured)
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

  } else if (req.url == '/c2opc' || req.url == "/c2opc_encr" ) {

    var result = '';

    // if there is a child process already running kill it
    if(cCompiler !== null) {
      kill(cCompiler.pid);
      cCompiler = null;
    }

    console.log("Compiling server");

    if( req.url == "/c2opc" ) {
      // call the c compiler to compile the unsecure server
      cCompiler = spawn('gcc',["-std=c99",
                        "-DUA_ARCHITECTURE_POSIX",
                        "-I/open62541/build/",
                        "-I/open62541/include/",
                        "-I/open62541/deps/",
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
                        "-I/open62541/deps/",
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

    // when the c compiler is finished, output http response
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
          res.write('<h3>Deploy and run server</h3>'); 
          res.write('<form action="run" method="post" enctype="multipart/form-data">');
          res.write('<input type="submit" value="Run ...">');
          res.write('</form>');

          // in case encrypted server was chosen show additional options
          if( req.url == "/c2opc_encr" ) {

            res.write('<hr>');
            res.write('<h3>Server Certificate Entity </h3>');
            res.write('<input type="button" value="Download current Certificate ..." onclick="window.open(\'/download/?file=server_cert.der\',\'_blank\')"><br><br>');
            res.write('<input type="button" value="Create new self signed Certificate Entity (certificate/key) ..." onclick="window.open(\'/cert_recreate\',\'_blank\')"><br><br>');
            res.write('<form action="/upload_cert" enctype="multipart/form-data" method="post">'+
                      '<input type="submit" value="Upload own Certificate (.DER-coded) ...">'+
                      '<input type="file" name="upload">'+
                      '</form>');
            res.write('<form action="/upload_key" enctype="multipart/form-data" method="post">'+
                      '<input type="submit" value="Upload own Private Key (.DER-coded) ...">'+
                      '<input type="file" name="upload">'+
                      '</form>');

          }

        res.write('</body>');
      res.write('</html>');
      res.end();

      cCompiler = null;
    });

  } else {

    // if there is a 'server' already give a hint
     find('name', 'server').then(function (list) {

       res.writeHead(200, {'Content-Type': 'text/html'});
       res.write('<html>');
         res.write('<hr>');
         res.write('<head>');
         res.write('<h3>Compile OPC UA nodeset XML </h3>');
         res.write('</head>');
         res.write('<body>');
           res.write('<form action="xml2c" method="post" enctype="multipart/form-data">');
             res.write('<input type="file" accept=".xml" name="filetoupload"><br><br>');
             res.write('<input type="submit" value="Compile ...">');
           res.write('</form>');
         res.write('</body>');

         if( list.length !== 0 ) {
           res.write('<br />Server status: running');
         } else {
           res.write('Server status: not running');
         }

         res.write('</html>');
         res.end();
      }, function (err) {
         console.log(err.stack || err);
      })
  }
}).listen(listenport);
