const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const joiningStudents = require("./model/Join");
const registerUsers = require("./model/Register");
const Products = require("./model/Product");
const Payment = require("./model/Payment");
const Recording = require("./model/recording");
const session = require("express-session");
const Razorpay = require("razorpay");
const {date}=require("./utils/date");
const Product = require("./model/Product");
const sendConfirmationEmail=require("./utils/mail")

const razorpay = new Razorpay({
  key_id: "rzp_test_i0Oi9Z6y9VOWGf",
  key_secret: "9WD1UuyT949mV6uTCLIPNSAI",
});
// Add session middleware
router.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);

router.get("/", async (req, res) => {
  res.render("index");
});

router.get("/join", (req, res) => {
  res.render("joinSession");
});

router.post("/join-session", (req, res) => {
  const { name, phoneNumber, email, state } = req.body;
  const joiners = new joiningStudents({
    name: name,
    phoneNumber: phoneNumber,
    email: email,
    date: new Date(),
    state: state,
  });
  joiners.save();
  res.redirect("/");
});

router.post("/register-user", async (req, res) => {
  const { name, phoneNumber, email, password } = req.body;
  try {
    const existingUser = await registerUsers.findOne({ email });
    if (existingUser) {
      console.log("User already exists");
      return res.redirect("/register");
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new registerUsers({
      name,
      phoneNumber,
      email,
      password: hashedPassword,
      role: 0, // Assuming default role for new users
    });
    await newUser.save();
    res.redirect("/");
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).send("Error registering user");
  }
});

router.get("/register", (req, res) => {
  res.render("register");
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.post("/auth", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await registerUsers.findOne({ email });
    if (!user) {
      console.log("User not found");
      return res.redirect("/login");
    }
    const passwordValid = await bcrypt.compare(password, user.password);
    if (passwordValid) {
      req.session.isAuth = true;
      req.session.user = user;
      if (user.role === 0) {
        return res.redirect("/");
      } else {
        return res.redirect("/admin");
      }
    } else {
      console.log("Wrong password");
      return res.redirect("/login");
    }
  } catch (error) {
    console.error("Error authenticating user:", error);
    res.status(500).send("Error authenticating user");
  }
});
router.get("/admin", isAdmin, (req, res) => {
  res.render("admin/dashboard");
});

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Error destroying session");
    }
    res.redirect("/");
  });
});

router.get("/contact", (req, res) => {
  res.render("contact");
});

router.get("/free-class", (req, res) => {
  res.render("freeClasses");
});

router.get("/students", isAdmin, async (req, res) => {
  try {
    const students = await joiningStudents.find().sort({ date: "desc" });
    res.render("admin/joinStudents", { classStudents: students });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).send("Error fetching students");
  }
});
router.get("/users", isAdmin, async (req, res) => {
  try {
    const allUsers = await registerUsers.find({ role: 0 });
    console.log("allUsers");
    res.render("admin/allUsers", { AllUsers: allUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Error fetching users");
  }
});
router.get("/courses", async (req, res) => {
  const products = await Products.find({ status: 1 });
  res.render("courses", { products: products });
});
router.post("/store-product", isAdmin, async (req, res) => {
  const { title, img, price, status, desc } = req.body;
  const product = new Products({
    title: title,
    img: img,
    price: price,
    status: status,
    desc: desc,
  });
  await product.save();
  const {id}=product
  console.log(id)
  const recordings= new Recording({product:id})
  recordings.save()
  // res.json(recordings,product)
  res.status(200).json({recordings,product})
  // res.redirect("/courses");
});
router.get("/checkout", isAuth, async(req, res) => {
  let {product}=req.query
  let productDetails=await Products.findOne({title:product})
  console.log(productDetails)
  const options = {
    amount: productDetails.price*100,
    currency: "INR",
    receipt: "order_receipt",
    payment_capture: 1,
  };
  razorpay.orders.create(options, (err, order) => {
    if (err) {
      console.log(err);
      return;
    }
    res.render("checkout", { order: order ,product:productDetails,user:req.session.user});
    // console.log(order);
  });
});
router.post("/payment-success", async (req, res) => {
  const {productId}=req.body
  const response = await razorpay.payments.fetch(req.body.razorpay_payment_id);
  const {created_at,description,email}=response
  const user=req.session.user
  let data= new Payment({
    name:user.name,
    email:response.email,
    phoneNumber:response.contact,
    id:response.id,
    amount:response.amount/100,
    status:response.status,
    order_id:response.order_id,
    method:response.method,
    desc:response.description,
    date: date(created_at),
  })
  data.productId=productId
  await data.save()
  const product= await Product.findOne({title:description})
  const User= await registerUsers.findOne({email:email})
  User.product.push(product.id)
  await User.save()
  // Define email subject
const emailSubject = "Congratulations on Joining Our Full-Stack Web Development Course + Free One-Month Internship Offer!";

// Define email content
const emailContent = `
Dear [${user.name}],

We are thrilled to inform you that your enrollment for our Full-Stack Web Development course has been successfully processed! On behalf of the entire team here at [Your Company/Organization Name], welcome aboard!

We are confident that this course will provide you with comprehensive knowledge and practical skills in full-stack web development, empowering you to embark on a successful career in the tech industry.

As an added bonus, we are excited to offer you a complimentary one-month internship opportunity upon successful completion of the course. This internship will provide you with valuable hands-on experience, allowing you to further hone your skills and gain real-world exposure to web development projects.

Below, you will find an attached offer letter detailing the terms and conditions of the internship. Please review it carefully and feel free to reach out to us if you have any questions or require further clarification.

Once again, congratulations on taking this important step towards advancing your career in web development! We look forward to supporting you throughout your learning journey and witnessing your growth and success.

Best regards,

[Your Name]
[Your Position/Title]
[Your Contact Information]
[Your Company/Organization Name]
`;

  const send=await sendConfirmationEmail(user.email,emailSubject,emailContent)
  console.log(send)
  res.redirect("/access-product");
});
router.get("/payments",isAdmin,async (req, res)=> {
  
  const payment=await Payment.find()
  res.render("admin/payments",{payment:payment});
});
router.get("/dashboard/:id",isAuth,isPaid,async(req, res) => {
  const {id}=req.params
  const recordings= await Recording.findOne({product:id})
  // res.json(recordings)
  res.render("auth/dashboard",{id});
});
router.get("/tasks/:id",isAuth,isPaid,(req, res) => {
  res.render("auth/tasks",{id:req.params.id});
});
// router.get("/invoice/:id",isAuth,isPaid,async(req, res) => {
//   const {email}=req.session.user
//   const invoice= await registerUsers.findOne({email:email})
//   const {id}=req.params
//   console.log(id)
//   const product= await Products.findById(id)
//   console.log(product)
//   res.render("auth/invoice",{Invoice:invoice,id});
// });
router.get("/invoice/:id", isAuth, isPaid, async (req, res) => {
  try {
    const { email } = req.session.user;
    const { id } = req.params;
    const product = await Products.findById(id);
    // const {title}=product
    const invoice= await Payment.findOne({email:email,productId:id})
    // res.json({invoice})
    res.render("auth/invoice", { Invoice: invoice, product: product, id: id });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.get("/certification/:id",isAuth,isPaid,async(req, res) => {
  try {
    const { email } = req.session.user;
    const { id } = req.params;
    console.log("Product ID:", id);
    const product = await Products.findById(id);
    const invoice= await Payment.findOne({email:email,productId:id})
    res.render("auth/certification", { Invoice: invoice, product: product, id: id });
  } catch (error) {
    console.error("Error:", error);
    // Handle the error appropriately (e.g., send an error response)
    res.status(500).send("Internal Server Error");
  }
});
router.get("/interview/:id",isAuth,isPaid,(req, res) => {
  res.render("auth/interview",{id:req.params.id});
});
router.get("/access-product",async (req, res) => {
  const {email}= req.session.user
  const user = await registerUsers.findOne({email:email}).populate({path:"product",select:"title price desc status"})
  res.render("auth/access",{user});
});
router.patch("/update/:id",async (req, res) => {
  console.log("patch req is working")
  const{id}=req.params
  const product= await Products.findByIdAndUpdate(id,req.body)
  console.log(product)
  product.save()
  
  res.redirect("/courses");
});
router.delete("/destroy/:id", async(req, res) => {
    const { id } = req.params;
    const destroy = await Products.deleteOne({ _id: id });
    console.log(destroy)
    res.redirect("/admin");

  // res.render("pageNotFound");
});
router.get("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Products.findOne({ _id: id });

    if (!product) {
      return res.status(404).send("Product not found");
    }

    res.render("admin/update", { product: product });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/all-products",isAdmin,async(req, res) => {
  const products = await Products.find({ status: 1 });
  res.render("admin/allProducts", { products: products });
});
router.get("/web-dev", (req, res) => {
  res.render("webDev");
});
router.get("/ai-ml", (req, res) => {
  res.render("ai");
});
router.get("/aws", (req, res) => {
  res.render("aws");
});
router.get("/privacy-policy", (req, res) => {
  res.render("privacyPolicy");
});
router.get("*", (req, res) => {
  res.render("pageNotFound");
});

// Middleware to check if user is authenticated
function isAuth(req, res, next) {
  if (req.session.isAuth) {
    next();
  } else {
    res.redirect("/login");
  }
}

// Middleware to check if user is an admin
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 1) {
    next();
  } else {
    res.redirect("/login");
  }
}
// Middleware to check if user is an paid user
async function isPaid(req, res, next){
  const paid= await Payment.findOne({status:"captured"})
  if (paid){
    next();
  } else {
    res.redirect("/courses");
  }
}

module.exports = router;
