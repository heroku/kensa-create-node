## `kensa create my_addon --template node`

this repository is a sinatra template application for use with the 
Heroku <a href="http://github.com/heroku/kensa">kensa</a> gem

clone it via:

    > gem install kensa
    > kensa create my_addon --template node
    > cd my_addon
    > npm install
    > foreman start

In a new window: 

    > kensa test provision
    > kensa sso 1

And you should be in a Heroku Single Sign On sesion for your brand new addon! 
