<?php
class rolesDao{
public function mostrasRoles(){
        $cnn = conexion::conectar();
        $mensaje = "";
        try{
           $mostrasRoles = 'SELECT * FROM : roles';
           $query  = $cnn ->prepare($mostrasRoles) ;
           $query ->execute();
          return $query->fetchAll();
        } catch (Exception $ex) {
             echo 'Error'.$ex->getMessage();
         }
    }
 
}
