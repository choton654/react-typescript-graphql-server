import { Field, ID, ObjectType } from "type-graphql";
import {
  Column,
  ObjectIdColumn,
  Entity,
  ObjectID,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  Index,
} from "typeorm";
import { User } from "./User";

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field(() => ID)
  @ObjectIdColumn()
  id!: ObjectID;

  @ManyToOne(() => User, (user) => user.posts)
  creator: User;

  @Field()
  @Column()
  title!: string;

  @Field()
  @Column()
  text!: string;

  @Field()
  @Column({ type: "int" })
  @Index({})
  points: number = 0;

  @Field(() => String)
  @Column({ nullable: false })
  creatorId!: number;

  @Field(() => String)
  @CreateDateColumn({ type: "date" })
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
