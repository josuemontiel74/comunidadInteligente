<?php

class tipoDocumento{
public function mostrasDocumento(){
        $cnn = conexion::conectar();
        $mensaje = "";
        try{
           $mostrasDoc = 'SELECT * FROM : tipoDocumento';
           $query  = $cnn ->prepare($mostrasDoc) ;
           $query ->execute();
          return $query->fetchAll();
        } catch (Exception $ex) {
             echo 'Error'.$ex->getMessage();
         }
    }
 
}