# cocoapods.org

## Setup

1. Clone a copy of [Strata](https://github.com/CocoaPods/Strata) and run `rake clone`. Or if you just want this website `rake clone:cocoapods`.
2. Run `rake db:migrate` to update the database to the latest version.
3. Add a `.env` file with ENVIRONMENT variables, see `sample.env`.

## Running

1. `bundle exec foreman start`

## What is this app?

Right now it is a hybrid of a Sinatra app ( see `app.rb` ) and a static Middleman app. Pod pages, and anything database-dependant are ran from the above command. Things like the index, or the about page are generated from inside the middleman folder. To update those:

1. Update the files in `/middleman/source`.
2. Run `bundle exec middleman build` in `/middleman`.
3. Commit changes.