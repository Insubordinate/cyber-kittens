const express = require('express');
const app = express();
const { User,Kitten } = require('./db');
const jwt = require('jsonwebtoken')
app.use(express.json());
app.use(express.urlencoded({extended:true}));

const {JWT_SECRET = 'neverTell'} = process.env;


app.get('/', async (req, res, next) => {
  try {
    res.send(`
      <h1>Welcome to Cyber Kittens!</h1>
      <p>Cats are available at <a href="/kittens/1">/kittens/:id</a></p>
      <p>Create a new cat at <b><code>POST /kittens</code></b> and delete one at <b><code>DELETE /kittens/:id</code></b></p>
      <p>Log in via POST /login or register via POST /register</p>
    `);
  } catch (error) {
    console.error(error);
    next(error)
  }
});

// Verifies token with jwt.verify and sets req.user
// TODO - Create authentication middleware

const setUser = async(req,res,next) =>{
  const auth = req.header('Authorization')
  if(!auth){
    next();
  }else{
    const [,token] = auth.split(' ')
    const user = jwt.verify(token,JWT_SECRET)
    req.user = user
    next()
  }
}
// POST /register
// OPTIONAL - takes req.body of {username, password} and creates a new user with the hashed password

// POST /login
// OPTIONAL - takes req.body of {username, password}, finds user by username, and compares the password with the hashed version from the DB

// GET /kittens/:id
// TODO - takes an id and returns the cat with that id

app.get('/kittens/:id',setUser,async(req,res,next)=>{
  if(!req.user){
    res.sendStatus(401)
  }else{
      const kitty = await Kitten.findOne({where:{ownerId:req.params.id},raw:true})
      if(req.user.id!=kitty.ownerId){
        res.sendStatus(401)
      }else{
        
        res.send({name:kitty.name,age:kitty.age,color:kitty.color})
      }
  }
  

})
// POST /kittens
// TODO - takes req.body of {name, age, color} and creates a new cat with the given name, age, and color
app.post('/kittens',setUser,async(req,res,next)=>{
  if(!req.user){
    res.sendStatus(401)
  }else{
    const {name,age,color} = req.body;
    const kitty = await Kitten.create({name:name,age:age,color:color,ownerId:req.user.id})
    res.status(201)
    res.send({name:kitty.name,age:kitty.age,color:kitty.color})
  }
})
// DELETE /kittens/:id
// TODO - takes an id and deletes the cat with that id
app.delete('/kittens/:id',setUser,async(req,res,next)=>{
  if(!req.user){
    res.sendStatus(401)
  }else{
      const kitty = await Kitten.findOne({where:{ownerId:req.params.id},raw:true})
      if(req.user.id!=kitty.ownerId){
        res.sendStatus(401)
      }else{
        
        await Kitten.destroy({where:{ownerId:req.params.id}})
        res.sendStatus(204)
      }
  }
  

})
// error handling middleware, so failed tests receive them
app.use((error, req, res, next) => {
  console.error('SERVER ERROR: ', error);
  if(res.statusCode < 400) res.status(500);
  res.send({error: error.message, name: error.name, message: error.message});
});

// we export the app, not listening in here, so that we can run tests
module.exports = app;
