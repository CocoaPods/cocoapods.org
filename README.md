# cocoapods.org

## Setup

Ideally this website should be ran through a sub-folder of [Strata](https://github.com/CocoaPods/Strata).

1. Clone a copy of [Strata](https://github.com/CocoaPods/Strata) and run `rake clone`. Or if you just want this website `rake clone:cocoapods`.
2. Run `rake db:migrate` in Strata to update the database to the latest version.
3. Add a `.env` file with in CocoaPods.org ENVIRONMENT variables, see `sample.env`.

## Running

1. `bundle exec foreman start`

The server will run on http://localhost:5000

## Things to note

* Large scale design changes should be discussed in a [new issue](https://github.com/cocoapods/cocoapods.org/issues/new) first.
* By default the server will use the production search database in a development environment. This is so you don't have to run your own instance of search.

## What is this?

This app is a Sinatra app. We use [slim](http://slim-lang.com) as a templating language, and [flounder](https://bitbucket.org/technologyastronauts/oss_flounder/) as our ORM against the trunk database.

A lot of the logic around search is based on work from [@floere](https://github.com/floere) in [picky](http://pickyrb.com). All of the CocoaPods specific parts of search is in [search.config.js](https://github.com/CocoaPods/cocoapods.org/blob/master/assets/javascripts/search.config.js).



## Things to note

* Large scale design changes should be discussed in a [new issue](https://github.com/cocoapods/cocoapods.org/issues/new) first.
* By default the server will use the production search database in a development environment. This is so you don't have to run your own instance of search.

## What is this?

This app is a Sinatra app. We use [slim](http://slim-lang.com) as a templating language, and [flounder](https://bitbucket.org/technologyastronauts/oss_flounder/) as our ORM against the trunk database.

A lot of the logic around search is based on work from [@floere](https://github.com/floere) in [picky](http://pickyrb.com). All of the CocoaPods specific parts of search is in [search.config.js](https://github.com/CocoaPods/cocoapods.org/blob/master/assets/javascripts/search.config.js).
## Things to note

* Large scale design changes should be discussed in a [new issue](https://github.com/cocoapods/cocoapods.org/issues/new) first.
* By default the server will use the production search database in a development environment. This is so you don't have to run your own instance of search.

## What is this?

This app is a Sinatra app. We use [slim](http://slim-lang.com) as a templating language, and [flounder](https://bitbucket.org/technologyastronauts/oss_flounder/) as our ORM against the trunk database.

A lot of the logic around search is based on work from [@floere](https://github.com/floere) in [picky](http://pickyrb.com). All of the CocoaPods specific parts of search is in [search.config.js](https://github.com/CocoaPods/cocoapods.org/blob/master/assets/javascripts/search.config.js).
