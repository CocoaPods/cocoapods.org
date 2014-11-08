# cocoapods.org

## Setup

1. Add a `.env` file with ENVIRONMENT variables, see `sample.env`.
2. Run `rake bootstrap`

## Running

1. `bundle exec foreman start`

## Updating the static part

1. Update the files in `/middleman/source`.
2. Run `rake build` in root dir.
3. Commit changes.