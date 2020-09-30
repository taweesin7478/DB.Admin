FROM node:12

ADD . app

WORKDIR app

#ENV NODE_ENV production

RUN npm install --unsafe-perm \
 && npm cache clear --force

EXPOSE 9213

#ENTRYPOINT [ "./docker-entrypoint.sh" ]
CMD [ "npm","run","dev" ]
