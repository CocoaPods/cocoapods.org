# cocoapods.org

## Setup

1. Install PostgresSQL locally. [Mac](http://postgresapp.com/)
2. Create a database called `trunk_cocoapods_org_development` using `CREATE DATABASE trunk_cocoapods_org_development;`
3. Clone the [Humus](https://github.com/CocoaPods/Humus) repository which contains the migrations for the database.
4. In the Humus directory run `bundle exec rake db:migrate` after running `bundle install`.
5. Add a `.env` file with ENVIRONMENT variables, see `sample.env`.

## Running

1. `bundle exec foreman start`

## Updating the static part

1. Update the files in `/middleman/source`.
2. Run `bundle exec middleman build` in `/middleman`.
3. Commit changes.