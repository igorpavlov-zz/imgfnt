const express = require('express');
const app = express();
const port = process.env.PORT || 8000;
const host = process.env.API_HOST || "http://localhost:8000";
const tmpPath = process.env.NODE_ENV==="production"?"/tmp":__dirname+"/tmp";
const imgPath = __dirname+"/images";
const bodyParser = require('body-parser')
const multer = require("multer");
const upload = multer({ dest: tmpPath })

app.set('views', __dirname + '/views')
app.set('view engine', 'pug')

app.use(bodyParser());

app.use(express.static(__dirname + '/public'));

app.listen(port,function(){console.log("RUN")});

app.get('/', (req, res, next) => {
  res.render('index',{host: host});
});

app.get('/custom', (req, res, next) => {
  res.render('custom',{IMG: req.query.img,host:host});
});

app.get('/api/v1/generate', (req, res, next) => {
  const t = req.query.text;
  const u = req.query.url;
  const w = req.query.width;
  const h = req.query.height;
  const b = req.query.background;
  if(t && u){
    const rand = Math.round(Math.random()*100000000);
    const imageFilePath = tmpPath+'/orig'+rand+'.png';
    const cmd = require("node-cmd");
    cmd.get('curl -o ' + imageFilePath + ' "'+u.replace(/"/g,"\\\"")+'"',function(err, data, stderr){
      if(err){
        sendPixel(err,res)
      } else {
        generate({
          t,
          imageFilePath,
          w,
          h,
          b,
        }, req, res, next)
      }
    });
  } else {
    sendPixel("No text or image defined",res);
    return;
  }
});

function generate(params, req, res, next){
  const t = params.t.replace(/"/g,"\\\"");
  const b = params.b?"\""+params.b.replace(/"/g,"\\\"")+"\"":"transparent";
  const imageFilePath = params.imageFilePath;
  const rand = Math.round(Math.random()*100000000);
  if(t){
    const cmd = require("node-cmd");
    cmd.get('identify '+imageFilePath,function(err, data, stderr){
      if(err){
        sendPixel(err,res)
        return;
      }
      const props = data.match(/\d+x\d+/)[0].split("x");
      const w = props[0];
      const h = props[1];
      const tl = t.length;
      const ts = (tl<=w/h?h*1.3:w/tl*1.5);
      
      
      const textFilePath = tmpPath+'/text'+rand+'.png';
      const resultFilePath = tmpPath+'/result'+rand+'.png';
      const font = __dirname+"/fonts/SourceCodePro-Black.ttf";
      cmd.get('convert -size '+w+'x'+h+' -background transparent -pointsize '+ts+' -font '+font+' -gravity Center label:"'+t+'" '+textFilePath,function(err, data, stderr){
        if(err){
          sendPixel(err,res)
          return;
        }
        cmd.get("composite -compose in "+imageFilePath+" "+textFilePath+" "+resultFilePath,function(err, data, stderr){
          if(err){
            sendPixel(err,res)
            return;
          }
          cmd.get("convert "+resultFilePath+" -trim +repage "+resultFilePath,function(err, data, stderr){
            if(err){
              sendPixel(err,res)
              return;
            }
            cmd.get('identify '+resultFilePath,function(err, data, stderr){
              if(err){
                sendPixel(err,res)
                return;
              }
              const trimmed_props = data.match(/\d+x\d+/)[0].split("x");
              const trimmed_w = trimmed_props[0];
              const trimmed_h = trimmed_props[1];
              const toWidth = parseInt(params.w || trimmed_w);
              const toHeight = parseInt(params.h || trimmed_h);
              cmd.get("convert "+resultFilePath+" -resize "+toWidth+"x"+toHeight+" "+resultFilePath,function(err, data, stderr){
                if(err){
                  sendPixel(err,res)
                  return;
                }
                cmd.get("convert "+resultFilePath+" -background transparent -gravity center -extent "+toWidth+"x"+toHeight+" "+resultFilePath,function(err, data, stderr){
                  if(err){
                    sendPixel(err,res)
                    return;
                  }
                  cmd.get('convert -size '+toWidth+'x'+toHeight+' xc:'+b+' ' +imageFilePath,function(err, data, stderr){
                    if(err){
                      sendPixel(err,res)
                      return;
                    }
                    cmd.get("composite -compose over "+resultFilePath+" "+imageFilePath+" "+resultFilePath,function(err, data, stderr){
                      if(err){
                        sendPixel(err,res)
                        return;
                      }
                      if(params.download){
                        res.setHeader('Content-disposition', 'attachment; filename=result.png');
                      }
                      res.sendFile(resultFilePath,{},function (err) {
                        if(err){
                          sendPixel(err,res)
                          return;
                        }
                        cmd.run("rm "+imageFilePath);
                        cmd.run("rm "+textFilePath);
                        cmd.run("rm "+resultFilePath);
                      });
                    });
                  })
                })
              })
            })
          })
        })
      })
    })
  } else {
    res.send({status: "error", message: "no text specified"});
  }
}

function sendPixel(err,res){
  console.log(err)
  res.sendFile(imgPath+"/broken.png");
}