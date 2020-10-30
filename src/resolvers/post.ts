import { isAuth } from "./../middleware/isAuth";
import { MyContext } from "./../types";
import { ObjectID } from "typeorm";
import { Post } from "./../entity/Post";
import {
  Query,
  Resolver,
  Arg,
  ID,
  Mutation,
  Field,
  InputType,
  Ctx,
  UseMiddleware,
  Int,
} from "type-graphql";

@InputType()
class PostInput {
  @Field()
  text: string;
  @Field()
  title: string;
}

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<Post[]> {
    const realLimit = Math.min(50, limit);

    let posts;

    if (cursor) {
      posts = Post.find({
        take: realLimit,
        order: { createdAt: "DESC" },
        where: { createdAt: { $lt: new Date(parseInt(cursor)) } },
      });
    } else {
      posts = Post.find({
        take: realLimit,
        order: { createdAt: "DESC" },
      });
    }

    return posts;
  }

  @Query(() => Post, { nullable: true })
  post(@Arg("id", () => ID) id: ObjectID): Promise<Post | undefined> {
    return Post.findOne(id);
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    const post = await Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
    return post;
  }

  @Mutation(() => Post)
  async updatePost(
    @Arg("id", () => ID) id: ObjectID,
    @Arg("title", () => String, { nullable: true }) title: string
  ): Promise<Post | null> {
    const post = await Post.findOne(id);
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      post.title = title;

      await Post.update({ id }, { title });
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg("id", () => ID) id: ObjectID): Promise<Boolean> {
    await Post.delete({ id });
    return true;
  }
}
