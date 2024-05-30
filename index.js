import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import express from "express";
// import client from "./components/redisConnection";
// import dbConnect from "./src/dbConnect";
import { createClient } from "redis";
// import User from "./utils/User";
async function init() {
  const app = express();
  const server = createServer(app);

  const PORT = 4000;
  const io = new Server(server, {
    cors: {
      allowedHeaders: ["https://riksham.com"],
      origin: "https://riksham.com",
      // allowedHeaders: ["https://riksham-app.onrender.com"],
      // origin: "https://riksham-app.onrender.com",
      // allowedHeaders: ["http://localhost:3000"],
      // origin: "http://localhost:3000",
    },
  });
  // import jwt from "jsonwebtoken";
  // import crypto from "crypto";
  const dataStructure = {
    _id: Number,
    uName: String,
    address: String,
    area: String,
    pinCode: Number,
    district: String,
    state: String,
    tofPay: {
      type: String,
      enum: [
        "Pay on Delivery",
        "Credit Card",
        "Debit Card",
        "Net Banking",
        "PayPal",
        "Google Pay",
        "UPI",
      ],
    },
    exInfo: {
      openBox: Boolean,
      oneTime: Boolean,
      gitPack: String,
    },
    payId: String,
    createdAt: Date,
    items: [
      {
        _id: Number,
        name: String,
        tOfP: String,
        image: String,
        iSN: String,
        imageSetD: String,
        vD: String,
        current: Number,
        statusUP: Date,
        qty: Number,
        time: String, // canceled hone ka resion hoga aur delivered hone par delete
        variantD: String,
      },
    ],
  };
  let User = new mongoose.Schema(
    {
      _id: Number,
      fName: String,
      lName: String,
      email: String,
      password: String,
      mobileNo: String,
      role: [String],

      // "User"
      // "Product deil , Set Qty, and Price  Manager" => S D_&_P  M
      // "Product District Stock and Order Manager"  => P D S_&_O
      // "Product information Create, read, update" => => p-general

      location: [
        {
          _id: Date,
          address: String,
          pinCode: String,
          state: String,
          district: String,
          area: String,
        },
      ],

      cartPro: [
        {
          _id: Number,
          vD: String,
          iSN: String,
        },
      ],

      gender: String,
      bDate: Number,
      bMonth: Number,
      bYear: Number,
      canceled: [dataStructure],
      delivered: [dataStructure],
      searchKeys: [String],
      intTofP: [String],
      nOfNOrder: Number,
      // default: new Date(Date.now() + 5.5 * 60 * 60 * 1000),
      tokens: {},
      issues: {},
      // token: String,
      // tokenExpire: Date,
      // verificationFailed: Number,
      // tokensSent: Number,
      // holdOnToken: Date,
      // holdOnVerification: Date,
      createdAt: Date,
    }
    // { versionKey: false }
  );

  // _________________________________________
  // forgot password
  // User.methods.resetPassword = function () {
  //   const randomString = crypto.randomBytes(20).toString("hex");

  //   this.resetPasswordToken = crypto
  //     .createHash("sha256")
  //     .update(randomString)
  //     .digest("hex");
  //   this.restPasswordExpire = Date.now() + 15 * 60 * 1000;
  //   return randomString;
  // };
  // ___________________________________________

  // agar models me user collection pahale se hai to hum uska use karege anyatha new collection create karege

  User = mongoose.models.User || mongoose.model("User", User);

  server.listen(PORT, () => {
    console.log(`HTTP server started at PORT: ${PORT}`);
  });

  io.on("connect", (socket) => {
    console.log(`New Socket Connected ${socket.id}`);
    socket.on("message", async (message) => {
      let data;
      let userName = undefined;
      const _id = 1;

      const client = createClient({
        password: "DneZppkVrJcosoKQ2ywuLh2CrBnQHwoz",
        socket: {
          host: "redis-13472.c330.asia-south1-1.gce.redns.redis-cloud.com",
          port: 13472,
        },
        // socket: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT },
      });
      // client.configSet("no_persistence");
      client.on("error", (err) => console.log("err", err));

      if (!client.isOpen) {
        client.connect();
        console.log("redis server is connected");
      }
      try {
        data = await client.hGetAll(`user:${_id}`);
      } catch (err) {}
      if (data) {
        userName = "redis data" + JSON.stringify(data);
      }

      mongoose
        .connect(
          "mongodb+srv://riksham:Riksham17022000@cluster0.jnegnqs.mongodb.net/ecommerce?retryWrites=true&w=majority"
        )
        .then(() => {
          console.log(`server is connected port: ${mongoose.connection.host}`);
        })
        .catch((err) =>
          console.log(`server in not connected for data base: ${err}`)
        );

      data = await User.findById(_id, {
        canceled: 0,
        delivered: 0,
      }).select("+password");
      console.log("mongodb fetch", data);
      const { fName, lName } = data || {};
      const userValue = { fName, lName, time: Date.now() };
      try {
        await client.hSet(`user:${_id}`, userValue);
        await client.expire(`user:${_id}`, 1015); //86400
      } catch (err) {}

      io.emit("server-message", userName);
    });

    socket.on("userDisconnected", (data) => {
      console.log("user disconnect function :", data);
      // Handle the message received from the server
    });
    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.id);
    });
  });
}

init();
