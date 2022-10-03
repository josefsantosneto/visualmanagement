require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const findorcreate = require("mongoose-findorcreate");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const passport = require("passport");
const cookieParser = require('cookie-parser');
const querystring = require("querystring");
const _ =require("lodash");
const { connect } = require('http2');
const data = require('./data.json');
//watch it

//setting up the express
const app = express();


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));

//watch it
app.use(cookieParser());

app.use(session({
    secret:process.env.SECRET
    //resave: false,
    //saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

// mongoose.connect("mongodb+srv://"+ process.env.CEHAB_SERVER + ".o5ulap5.mongodb.net/projetos", {useNewUrlParser: true});

mongoose.connect("mongodb+srv://"+ process.env.DB_KEY +"@cluster0.tnsju.mongodb.net/Cehab_test", {useNewUrlParser: true});

//setting the schemas

const userSchema = new mongoose.Schema({

    username: String,
    email:String,
    password: String,
    setor: String,
    type: String

});


//Should find a way to get the user

const projectSchema = new mongoose.Schema({
    nomeDoProjeto: String,
    numeroSolicitacao: String,
    SEI: String,
    valor: Number,
    descricao: String,
    createdBy: [userSchema],
    dataInicio: String,
    dataTermino: String,
    createdIn: String,
    status: String,
    colorStatus: String,
    ultimaAtualizacao: [userSchema],
    setorAtual: String,
    updatedLastDate: String,
    problemComment: String,
    percentageDone: String

   
});



const Project = new mongoose.model("Project", projectSchema);





userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findorcreate);

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());


passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, email: user.email });
      //wacth it
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

//this code was created to add some data into the database

app.get('/data',(req,res)=>{
    console.log(data.file[0].nomeDoProjeto);
    data.file.forEach((file)=>{
        const project = new Project(file);
        project.save();
    });
    res.redirect("/");
    console.log("Database updated");

});




app.get("/", function(req, res){
    res.render("login");
    
});

app.post("/", function(req,res){
    const user = new User({
        username:req.body.username,
        password:req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/home_menu");
                

            });
        }
    });

});

app.get("/updateall", (req,res)=>{
    if(req.isAuthenticated()){
        const session = req.session;
        const userId = session.passport.user.id;
        User.findOne({_id:userId}, (err,foundUser)=>{
            if(err){
                console.log(err);      
            }else{
                if(foundUser.type==="adm"){
                    Project.find({}, (err, foundProject)=>{
                        res.render("updateall", {projetos:foundProject});
                    });
                }else{
                    res.redirect("/");
                    //should be an error redirect here
                }
            }
        });
    }else{
        res.redirect("/");
        //shoud redirect to an error which the person has no access
    }
});

app.post("/updateall", (req, res)=>{
    if(req.isAuthenticated()){
        const session = req.express;
        const userId = req.session.passport.user.id;
        User.findOne({_id:userId},(err, foundUser)=>{
           if(foundUser.type === "adm") {
                const proId = req.body.proId;
                const nomeProjeto = req.body.nomeprojeto;
                const descricao = req.body.descricao;
                const comentAtu = req.body.comentario;
                const setorAtual = req.body.setorAtual;
                const sei = req.body.sei;
                const valor = req.body.valor;
                const numeroSol = req.body.numeroSol;

                const dateIn = new Date(req.body.dataInicio);
                const dateOut = new Date(req.body.dataTermino);
        
                function ConversorData(date) {
                    const dd = String(date.getDate()).padStart(2,'0');
                    const mm = String(date.getMonth()+1).padStart(2,'0');
                    const yyyy = date.getFullYear();
                    return (dd+"/"+mm+"/"+yyyy);
                }
        
                const dataInicio = ConversorData(dateIn);
                const dataTermino = ConversorData(dateOut);

                Project.findOneAndUpdate({_id:proId},{$push: {ultimaAtualizacao: foundUser}}, function(err, foundProject){
                    if(!err){
                        console.log(foundProject + "id adicionado atualizado");
                    }
                });
                Project.findOneAndUpdate({_id:proId},
                    {
                        nomeDoProjeto:nomeProjeto,
                        descricao: descricao,
                        problemComment:comentAtu,
                        setorAtual:setorAtual,
                        SEI: sei,
                        valor:valor,
                        numeroSolicitacao:numeroSol,
                        dataInicio: dataInicio,
                        dataTermino:dataTermino,

                    }, function (err, foundProject){
                        if(!err){
                            console.log(foundProject + "projeto atualizado.");
                        }
                    });
                    res.redirect("/menuadm");

                


            }else{
                console.log(err);
                res.redirect("/");
            }

        });
    }
});


app.get("/deleteuser", (req,res)=>{
    if(req.isAuthenticated()){
        const session = req.session;
        const userId = session.passport.user.id;
        console.log(userId);

        User.findOne({_id:userId}, (err, foundUser)=>{
            if(foundUser.type === "adm"){
                User.find({}, (err, foundUsers)=>{
                    if(!err){
                        res.render("deleteuser", {users:foundUsers});
                    }else{
                        console.log(err);
                        res.render("/")
                    }

                });
            }else{
                console.log(err);
            }
        })

    }

});

app.post("/deleteuser", (req, res)=>{
    const ids = req.body.checkbox;
    User.deleteMany({_id:ids},(err, foundUser)=>{
        if(!err){
            console.log(foundUser + "deletado");
            res.redirect("/deleteuser");
        } else {
            console.log(err);
        }
    })

});

app.get("/userperm", (req,res)=>{
    if(req.isAuthenticated()){
        const session = req.session;
        const userId = session.passport.user.id;
        User.findOne({_id:userId},(err, foundUser)=>{
            if(foundUser.type === "adm"){
                const uTypes = [
                    {selection: "Adminsitrador Geral",
                     value: "adm"},
                     {selection: "Visualizador de Projetos",
                        value: "view"},
                    {selection: "Permissão para Alterar e Cadastrar Projetos" ,
                        value: "write"}
                ];

                User.find({}, function(err, foundUsers){
                    res.render("userperm", {users:foundUsers, userTypes:uTypes});
                });
                
            }else{
                console.log(err);
                res.redirect("/");
                
            }
        });
    }

});




app.post("/userperm", (req,res)=>{
    
    const userId = req.body.usernameId;
    const perm = req.body.type;

    User.findOneAndUpdate({_id:userId},
        {
            type:perm

    },(err, foundUser)=>{
        if(err){
            console.log(err);
        }else{
            res.redirect("/menuadm");
        }
    })


});


app.get("/menuadm",(req,res)=>{
    if(req.isAuthenticated()){
        const session = req.session;
        const userId = session.passport.user.id;
        User.findOne({_id:userId},(err, foundUser)=>{
            if(foundUser.type === "adm"){
                res.render("menu_adm");
            }else{
                console.log(err);
                res.redirect("/");
            }
        });
    }
});



app.get("/deleteupdate", function(req,res){
    if(req.isAuthenticated()){
            const session = req.session;
            const userId = session.passport.user.id;
            User.findOne({_id:userId}, function(err,foundUser){
                if(foundUser.type==="adm"){
                    Project.find({}, function(err, foundProject){
                            if(err){
                                console.log(err);
                            }else {
                                res.render("deleteupdate", {projetos:foundProject});
                            }
                        });
                    }
    
                });
       
    }
   
});


app.post("/deleteupdate", function(req,res){
    
    const ids = req.body.checkbox;
    Project.deleteMany({_id:ids}, function(err){
        if(err){
            console.log(err);
        }else{
            console.log("Projeto(s) deletado(s)");
            res.redirect("/deleteupdate");
        }
        });      

});

app.get("/home_menu",function(req,res){
    if(req.isAuthenticated()){
        const session = req.session;
        const userId = session.passport.user.id;

        User.findOne({_id:userId}, function(err, foundUser){
            if(foundUser.type === "adm"){
                res.render("home_menu_adm");
            }else if(foundUser.type === "write"){
                res.render("home_menu");
            }else {
                res.render("home_menu_view");
            }
        });
       
     
    }else{
        res.redirect("/");
    }
});

app.get("/projetos", function(req, res){
    if(req.isAuthenticated()) {
        let filter = {};

        if(req.query.status){
            if(req.query.status === "all"){
                filter={};
            }else{
                filter = {status:req.query.status};
                console.log(req.query.status);
            }
        }

        Project.find(filter, function(err, foundProjects){
            const selectList = [
                {selection:"",
                value:"all"},
                {selection: "Em Andamento",
                 value: "emAndamento"},
                 {selection: "Atrasado",
                    value: "atrasado"},
                {selection: "Problema" ,
                    value: "problema"},
                {selection: "Finalizado",
                    value: "finalizado"},
                {selection: "Sem Status",
                    value: "new"},
                {selection: "Todos",
                    value: "all"}
                

            ]

            res.render("projects", {projs:foundProjects, items:selectList});
        });
        
    }else{
        res.redirect("/");
    }
});




app.get("/novoprojeto", function(req, res){
    if(req.isAuthenticated()) {
        res.render("projectentry");
    }else{
        res.redirect("/");
    }
});

app.get("/statusprojeto", function(req, res){
    if(req.isAuthenticated()) {
        const selectList = [
            {selection: "Em Andamento",
             value: "emAndamento"},
             {selection: "Atrasado",
                value: "atrasado"},
            {selection: "Problema" ,
                value: "problema"},
            {selection: "Finalizado",
                value: "finalizado"}
        ]


        Project.find({}, function(err, foundProjects){
            res.render("projectstatus", {projs:foundProjects, selectList:selectList});
        });
        
    }else{
        res.redirect("/");
    }
});

app.post("/updatestatus", function(req,res){
   
    //console.log(userName);
   if(req.isAuthenticated()) {

        const proId = req.body.proid;
        const session = req.session;
        const userId = session.passport.user.id;
        const status = req.body.status;
        const setor = req.body.setor;
        const problemComment = req.body.problemComment;
        const percentageDone = req.body.percentageDone;
        var colorS = "projectbox";

        const now = new Date();
        

        if (status === "emAndamento"){
            colorS = "orange";
        }else if (status === "atrasado") {
            colorS = "yellow";
        }else if(status === "problema" ){
            colorS = "red";
        }else if (status === "finalizado") {
            colorS = "blue";
        }else {
            colorS = "projectbox";
        }



        User.findOne({_id:userId}, (err,foundUser)=>{
            Project.findOneAndUpdate({_id:proId},
                {$push:{ultimaAtualizacao:foundUser}}, 
                function(err, foundProject){
                    if (err){
                        res.redirect("/");
                    }
            });

        Project.findOneAndUpdate({_id:proId},
            {
                status:status,
                colorStatus:colorS,
                setorAtual:setor,
                updatedLastDate: now,
                problemComment: problemComment,
                percentageDone:percentageDone
                    }, (err, foundProject)=>{
            if(err){
                res.redirect("/");
            }
        });
    
            res.redirect("/home_menu");

        });


        
    }else {
        res.redirect("/");
    }

});


app.get("/test", function(req,res){
    if (req.isAuthenticated()){

        const session = req.session;
        const userId = session.passport.user.id;    
        
        User.findOne({_id:userId}, (err, foundUser)=>{
            if(err){
                console.log(err);
            }else{
                console.log(foundUser.username);
                console.log(foundUser.email);
                
            }
        });




    }else{
        res.redirect("/");
    }
   
   
   

    
    
    // const session=req.session;
    // //const userName = session.passport.user.username;
    // const info = session.passport.user.id;
    // console.log(info);
    // console.log("OK")
    // const now = new Date();
    // now.setHours(now.getHours()-3);
    // console.log(now);

    // const a = "The Book";
    // const b = _.lowerCase(a);
    // console.log(b);

    // // const d = new Date("2022/08/03");
    // const d = new Intl.DateTimeFormat('en');
    // d.formatToParts();
    
    // console.log(d);
    // const a = new Date();
    // function ConversorData(date) {
    //     const dd = String(date.getDate()).padStart(2,'0');
    //     const mm = String(date.getMonth()+1).padStart(2,'0');
    //     const yyyy = date.getFullYear();
    //     return (dd+"/"+mm+"/"+yyyy);
    // }

    // console.log(ConversorData(a));


});
app.get("/projetos/:projectId", function(req, res){

    if(req.isAuthenticated){
        const requestedProjectId = req.params.projectId;

        Project.findOne({_id: requestedProjectId}, function(err, project){
            if (project.status === "emAndamento"){
                var sit = "em andamento";
            }else {
                var sit = project.status;
            }

            //const ultimaAtu = project.ultimaAtualizacao[project.ultimaAtualizacao.length].username;
            const t = [];
            
            t.push(project.ultimaAtualizacao);
            a=t[0].length-1;
            const ultimaAtu = project.ultimaAtualizacao[a].username;
            const ultSetor = project.ultimaAtualizacao[a].setor;
        
            

            res.render("projectreport", {projeto: project, projetoStatus: sit, ultimaAtu:ultimaAtu, ultSetor:ultSetor});

        });



    }


});



app.post("/projectentry", function(req, res){
    //console.log(userName);
   //Should get back from here 02/08/2022
    if(req.isAuthenticated()){
        const session=req.session;
        const userId = session.passport.user.id;
        const now = new Date();
        console.log(now);
        const nomeProjeto = req.body.nomeprojeto;
        const numeroSol = req.body.solicitacao;
        const sei = req.body.sei;
        const valor = req.body.valor;
        const descricao = req.body.descricao;
        const dateIn = new Date(req.body.dataInicio);
        const dateOut = new Date(req.body.dataTermino);

        function ConversorData(date) {
            const dd = String(date.getDate()).padStart(2,'0');
            const mm = String(date.getMonth()+1).padStart(2,'0');
            const yyyy = date.getFullYear();
            return (dd+"/"+mm+"/"+yyyy);
        }

        const dataInicio = ConversorData(dateIn);
        const dataTermino = ConversorData(dateOut);
        

        User.findOne({_id:userId}, (err, foundUser)=>{
                if(err){
                    console.log(err);
                }else{
                    console.log(foundUser);

                    const project = new Project({
                        nomeDoProjeto: nomeProjeto,
                        numeroSolicitacao: numeroSol,
                        SEI: sei,
                        valor: String(valor).toLocaleString("de-DE",{minimumFractionDigits:2, maximumFractionDigits:2}),
                        descricao:descricao,
                        createdBy: foundUser,
                        dataInicio: dataInicio,
                        dataTermino:dataTermino,
                        createdIn: now,
                        status: "new",
                        colorStatus: "projectbox",
                        ultimaAtualizacao: foundUser,
                        setorAtual: "DOB",
                        updatedLastDate: now,
                        percentageDone: "0"
                    });
            
                    project.save();
                    res.redirect("/home_menu");
                    
                }
            });




        
       




    }else{
        res.redirect("/");
    }
});

app.get("/logout", function(req, res){
    req.logout(function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/");
        }
    })
});
app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function(req, res){

    if(req.body.password === req.body.confirmpassword){
        User.register({username: req.body.username}, req.body.password, function(err, user){
            if(err){
                console.log(err);
                res.redirect("/");
            }else{
                passport.authenticate("local")(req,res, function(){
                    const session = req.session;
                    const userId = session.passport.user.id;
                    const email = req.body.email;
                    const setor = req.body.setor;

                    User.findOneAndUpdate({_id:userId},
                        {email:email, setor:setor, email:email, type:"view"},
                        function(err, foundUser){
                            if(err){
                                console.log(err);
                                res.redirect("/");
                            }else{
                                console.log("User created.");
                            }
                        }
                        );
                    res.redirect("/home_menu");
                });
            }
        });

    }else{
       console.log("senhas diferentes");
    }


});

// app.listen(3000, function(){
//     console.log("Server running on port 3000 and on your network at the address: https://192.168.0.69:3000");
// });


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
