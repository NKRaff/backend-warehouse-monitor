import { connect } from 'mongoose'

export class MongooseORM {
  private constructor() {}

  public static create() {
    return new MongooseORM()
  }

  public async connectDatabase() {
    const uri = process.env.DB_URI
    if (!uri) throw new Error(`DB_URI não é definido`)
    await connect(uri)
      .catch((error) => console.error(`Erro ao se conecta ao MongoDB: ${error}`))
      .then(() => console.log(`💾 MongoDB esta conectando`))
  }
}
