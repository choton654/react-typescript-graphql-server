import { MyContext } from "src/types";
import { User } from "../entity/User";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import argon2 = require("argon2");
import { sendEmail } from "../utils/sendemail";
import { v4 } from "uuid";
import { ObjectId } from "@mikro-orm/mongodb";

@InputType()
class UsernamePasswordInput {
  @Field()
  email: string;
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class Error {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [Error], { nullable: true })
  errors?: Error[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { em, req }: MyContext) {
    console.log("session", req.session);

    if (!req.session.userId) {
      return null;
    }
    const user = await em.findOne(User, { _id: req.session.userId });
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    if (!options.email.includes("@")) {
      return {
        errors: [
          {
            field: "email",
            message: "invalid email",
          },
        ],
      };
    }
    if (options.username.length <= 2) {
      return {
        errors: [
          {
            field: "username",
            message: "length must be 2",
          },
        ],
      };
    }
    if (options.password.length <= 3) {
      return {
        errors: [
          {
            field: "password",
            message: "length must be 3",
          },
        ],
      };
    }
    const hashPassword = await argon2.hash(options.password);
    const newuser = em.create(User, {
      username: options.username,
      password: hashPassword,
      email: options.email,
    });
    try {
      await em.persistAndFlush(newuser);
    } catch (error) {
      console.error(error);
      if (error.code === 11000) {
        return {
          errors: [
            {
              field: "username",
              message: "username already taken",
            },
          ],
        };
      }
    }

    req.session.userId = newuser._id;

    return { user: newuser };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOremail") usernameOremail: string,
    @Arg("password") password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, {
      $or: [{ username: usernameOremail }, { email: usernameOremail }],
    });
    console.log(user);
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOremail",
            message: "user does not exists",
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "password does not match",
          },
        ],
      };
    }

    req.session.userId = user._id;

    return { user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) => {
      console.log("session", req.session);
      req.session.destroy((err) => {
        res.clearCookie("qid", { path: "/" });
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      });
    });
  }

  @Mutation(() => Boolean)
  async forgetPassword(
    @Arg("email") email: string,
    @Ctx() { em, redis }: MyContext
  ) {
    const user = await em.findOne(User, { email });
    if (!user) {
      // user not in db
      return true;
    }

    const token = v4();

    await redis.set(
      "forget-password:" + token,
      user._id.toString(),
      "ex",
      1000 * 60 * 60 * 24 * 3
    ); // 3 days

    sendEmail(
      email,
      `<a href='http://localhost:3000/change-password/${token}'>reset password</a>`
    );

    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("password") password: string,
    @Ctx() { em, req, redis }: MyContext
  ): Promise<UserResponse> {
    if (password.length <= 3) {
      return {
        errors: [
          {
            field: "password",
            message: "length must be 3",
          },
        ],
      };
    }

    // const token_array = token.split("-");
    // const userId = token_array[token_array.length - 1];
    const key = "forget-password:" + token;
    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "token expeired",
          },
        ],
      };
    }

    const user = await em.findOne(User, { _id: new ObjectId(userId) });

    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "user no longer exists",
          },
        ],
      };
    }
    await redis.del(key);

    user.password = await argon2.hash(password);
    em.persistAndFlush(user);

    req.session.userId = user._id;
    return { user };
  }
}
