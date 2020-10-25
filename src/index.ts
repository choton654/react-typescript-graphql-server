import "reflect-metadata";
import { ApolloServer } from "apollo-server-express";
import Express = require("express");
import { buildSchema } from "type-graphql";
import { MikroORM } from "@mikro-orm/core";
import { EntityManager, EntityRepository } from "@mikro-orm/mongodb";
import { User } from "./entity/User";
import { Post } from "./entity/Post";
import microOrmConfig from "./mikro-orm.config";
import { PostResolver } from "./resolvers/post";
import { HelloResolver } from "./resolvers/hello";
import { UserResolver } from "./resolvers/user";

export const DI = {} as {
  orm: MikroORM;
  em: EntityManager;
  postRepository: EntityRepository<Post>;
  userRepository: EntityRepository<User>;
};

const main = async () => {
  const orm = await MikroORM.init(microOrmConfig);
  DI.postRepository = orm.em.getRepository(Post);
  DI.userRepository = orm.em.getRepository(User);

  const schema = await buildSchema({
    resolvers: [HelloResolver, PostResolver, UserResolver],
    validate: false,
  });

  const app = Express();

  const apolloServer = new ApolloServer({
    schema,
    context: () => ({ em: orm.em }),
  });

  apolloServer.applyMiddleware({ app });

  app.listen(3000, () => {
    console.log("server started on http://localhost:3000/graphql");
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
