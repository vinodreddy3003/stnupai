const mongoose=require('mongoose')
const RegisterSchema= new mongoose.Schema({
    name:{type:String,required:true},
    phoneNumber:{type:Number,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    role:{type:Number,default:0},
    product: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product'
        }
      ]

})
module.exports = mongoose.model('Register',RegisterSchema)