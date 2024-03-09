const mongoose=require('mongoose')
const ProductSchema= new mongoose.Schema({
    title:{type:String,required:true},
    img:{type:String,required:true},
    price:{type:String,required:true},
    status:{type:Number,default:0,enum:[0,1]},
    desc:{type:String,required:true},
})
module.exports=mongoose.model('Product',ProductSchema)