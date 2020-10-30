import { MyContext } from "./types";
import "reflect-metadata";
import { ApolloServer } from "apollo-server-express";
import Express = require("express");
import { buildSchema } from "type-graphql";
import { User } from "./entity/User";
import { Post } from "./entity/Post";
import { PostResolver } from "./resolvers/post";
import { HelloResolver } from "./resolvers/hello";
import { UserResolver } from "./resolvers/user";
import session = require("express-session");
import cors = require("cors");
import connectRedis = require("connect-redis");
import { createConnection } from "typeorm";
import Redis = require("ioredis");

const main = async () => {
  await createConnection({
    type: "mongodb",
    url:
      "mongodb+srv://choton654:9804750147@cluster0-prdkh.mongodb.net/lireddit",
    useNewUrlParser: true,
    useUnifiedTopology: true,
    synchronize: true,
    logging: true,
    entities: [Post, User],
  });

  const schema = await buildSchema({
    resolvers: [HelloResolver, PostResolver, UserResolver],
    validate: false,
  });

  const RedisStore = connectRedis(session);
  const redis = new Redis();

  const app = Express();

  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  app.use(
    session({
      name: "qid",
      store: new RedisStore({ client: redis, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
      saveUninitialized: false,
      secret: "keyboard cat",
      resave: true,
    })
  );
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }): MyContext => ({ req, res, redis }),
  });

  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(4000, () => {
    console.log("server started on http://localhost:4000/graphql");
  });
};

main().catch((err) => console.error(err));

// const postRepository = orm.em.getRepository(Post);

// DI.em = orm.em;
// const post = await postRepository.create({ title: "my first post" });
// await postRepository.persistAndFlush(post);

// const posts = await orm.em.find(Post, {});
// console.log(posts);

// console.log("-----mongo------");

// console.log(orm.em);

// const redisClient = redis.createClient();
// const store = new MongoDBStore({
//   uri: "mongodb+srv://choton654:9804750147@cluster0-prdkh.mongodb.net",
//   databaseName: "lireddit",
//   collection: "mySessions",
// });

// store.on("error", function (error: any) {
//   console.log(error);
// });

// import { MikroORM } from "@mikro-orm/core";
// import microOrmConfig from "./mikro-orm.config";
// import { EntityManager, EntityRepository } from "@mikro-orm/mongodb";
// import connectRedis = require("connect-redis");
// const MongoDBStore = require("connect-mongodb-session")(session);

// const MongoStore = connectMongo(session);

// export const DI = {} as {
//   orm: MikroORM;
//   em: EntityManager;
//   postRepository: EntityRepository<Post>;
//   userRepository: EntityRepository<User>;
// };

// const orm = await MikroORM.init(microOrmConfig);
// DI.postRepository = orm.em.getRepository(Post);
// DI.userRepository = orm.em.getRepository(User);
