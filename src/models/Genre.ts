import { prop, modelOptions, getModelForClass } from '@typegoose/typegoose'
import { connection } from '../database'

@modelOptions({
  existingConnection: connection,
  schemaOptions: {
    timestamps: {
      updatedAt: 'updated_at',
      createdAt: 'created_at'
    },
    toJSON: {
      virtuals: true
    }
  }
})
export class Genre {
  @prop({ unique: true })
  public id: number

  public title: string
}

export const GenreModel = getModelForClass(Genre)