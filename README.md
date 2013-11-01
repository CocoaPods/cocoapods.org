CocoaPods Beta Site
==========

This is the repo for the new CocoaPods Guide site.


###I'd like to make a suggestion
Fantastic! Take a look at our [open issues](https://github.com/CocoaPods/beta.cocoapods.org/issues), and comment on one that seems relevant or open an issue. See our [CONTRIBUTING](CONTRIBUTING.md) guidelines for opening issues.

###I'd like to add my blog post or tutorial.
Delightful! Double check your link follows our [External Resource Guidelines](CONTRIBUTING.md), then make a pull request.

###I'd like to run guides.cocoapods.org locally
The guides site is built on [Middleman](http://middlemanapp.com), and runs on Ruby 1.9.3 or newer.

Steps to setup:

1. `$ git clone https://github.com/CocoaPods/guides.cocoapods.org.git`
2. `$ cd guides.cocoapods.org`
3. `$ git submodule update --init --recursive`
4. `$ bundle install`
5. `$ middleman server`
6. Open [localhost:4567](http://localhost:4567) in your browser. Changes will be processed automatically
